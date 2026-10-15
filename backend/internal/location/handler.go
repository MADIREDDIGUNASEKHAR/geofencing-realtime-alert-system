package location

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"geofencing-backend/internal/alert"
	"geofencing-backend/internal/geofence"
	"geofencing-backend/internal/httpx"
	"geofencing-backend/internal/ids"
	"geofencing-backend/internal/models"
	"geofencing-backend/internal/vehicle"
	"geofencing-backend/internal/violation"
	"geofencing-backend/internal/ws"
)

type Handler struct {
	locations  *Repository
	vehicles   *vehicle.Repository
	geofences  *geofence.Repository
	alerts     *alert.Repository
	violations *violation.Repository
	hub        *ws.Hub
}

func NewHandler(locations *Repository, vehicles *vehicle.Repository, geofences *geofence.Repository, alerts *alert.Repository, violations *violation.Repository, hub *ws.Hub) *Handler {
	return &Handler{
		locations:  locations,
		vehicles:   vehicles,
		geofences:  geofences,
		alerts:     alerts,
		violations: violations,
		hub:        hub,
	}
}

type updateRequest struct {
	VehicleID string  `json:"vehicle_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Timestamp string  `json:"timestamp"`
}

type currentGeofenceDTO struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Status       string `json:"status"`
}

type updateResponse struct {
	VehicleID        string               `json:"vehicle_id"`
	LocationUpdated  bool                 `json:"location_updated"`
	CurrentGeofences []currentGeofenceDTO `json:"current_geofences"`
	TimeNs           string               `json:"time_ns"`
}

// geofenceEvent captures a single entry/exit transition detected for one
// geofence during a location update, carrying everything dispatchAlerts
// needs without re-querying the database.
type geofenceEvent struct {
	geofence    models.ContainingGeofence
	eventType   string // entry | exit
	violationID string
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req updateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, "invalid JSON body")
		return
	}
	if req.VehicleID == "" {
		httpx.WriteError(w, http.StatusBadRequest, start, "vehicle_id is required")
		return
	}
	if req.Latitude < -90 || req.Latitude > 90 {
		httpx.WriteError(w, http.StatusBadRequest, start, "latitude must be between -90 and 90")
		return
	}
	if req.Longitude < -180 || req.Longitude > 180 {
		httpx.WriteError(w, http.StatusBadRequest, start, "longitude must be between -180 and 180")
		return
	}
	if req.Timestamp == "" {
		httpx.WriteError(w, http.StatusBadRequest, start, "timestamp is required")
		return
	}
	recordedAt, err := time.Parse(time.RFC3339, req.Timestamp)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, "timestamp must be ISO 8601 (e.g. 2025-01-15T10:35:00Z)")
		return
	}

	ctx := r.Context()

	veh, err := h.vehicles.GetByID(ctx, req.VehicleID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to look up vehicle")
		return
	}
	if veh == nil {
		httpx.WriteError(w, http.StatusNotFound, start, "vehicle not found")
		return
	}

	containing, err := h.geofences.ContainingGeofences(ctx, req.Latitude, req.Longitude)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to evaluate geofences")
		return
	}
	currentSet := make(map[string]models.ContainingGeofence, len(containing))
	for _, c := range containing {
		currentSet[c.GeofenceID] = c
	}

	tx, err := h.locations.BeginTx(ctx)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to start transaction")
		return
	}
	defer tx.Rollback(ctx) // no-op once committed below

	if err := h.locations.InsertLocation(ctx, tx, models.Location{
		VehicleID: req.VehicleID, Latitude: req.Latitude, Longitude: req.Longitude, RecordedAt: recordedAt,
	}); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to store location")
		return
	}

	previousSet, err := h.locations.CurrentGeofenceIDs(ctx, tx, req.VehicleID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to load geofence state")
		return
	}

	var events []geofenceEvent

	for id, c := range currentSet {
		if previousSet[id] {
			continue
		}
		if err := h.locations.SetGeofenceState(ctx, tx, req.VehicleID, id); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, start, "failed to update geofence state")
			return
		}
		violationID := ids.New("viol")
		v := models.Violation{ID: violationID, VehicleID: req.VehicleID, GeofenceID: id, EventType: "entry", Latitude: req.Latitude, Longitude: req.Longitude, OccurredAt: recordedAt}
		if err := h.violations.Insert(ctx, tx, v); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, start, "failed to record violation")
			return
		}
		events = append(events, geofenceEvent{geofence: c, eventType: "entry", violationID: violationID})
	}

	for id := range previousSet {
		if _, stillInside := currentSet[id]; stillInside {
			continue
		}
		g, err := h.geofences.GetByID(ctx, id)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, start, "failed to look up geofence")
			return
		}
		if err := h.locations.ClearGeofenceState(ctx, tx, req.VehicleID, id); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, start, "failed to update geofence state")
			return
		}
		if g == nil {
			// Geofence was deleted after the vehicle entered it; nothing to
			// report but the stale state entry above has still been cleared.
			continue
		}
		violationID := ids.New("viol")
		v := models.Violation{ID: violationID, VehicleID: req.VehicleID, GeofenceID: id, EventType: "exit", Latitude: req.Latitude, Longitude: req.Longitude, OccurredAt: recordedAt}
		if err := h.violations.Insert(ctx, tx, v); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, start, "failed to record violation")
			return
		}
		events = append(events, geofenceEvent{
			geofence:    models.ContainingGeofence{GeofenceID: g.ID, GeofenceName: g.Name, Category: g.Category},
			eventType:   "exit",
			violationID: violationID,
		})
	}

	if err := tx.Commit(ctx); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to commit location update")
		return
	}

	respGeofences := make([]currentGeofenceDTO, 0, len(containing))
	for _, c := range containing {
		respGeofences = append(respGeofences, currentGeofenceDTO{GeofenceID: c.GeofenceID, GeofenceName: c.GeofenceName, Status: "inside"})
	}

	httpx.WriteJSON(w, http.StatusOK, updateResponse{
		VehicleID:        req.VehicleID,
		LocationUpdated:  true,
		CurrentGeofences: respGeofences,
		TimeNs:           httpx.ElapsedNs(start),
	})

	// Alert delivery happens after the response is written so it never adds
	// latency to the location-update request; all DB/network work from here
	// runs on a detached context since the request's own context is about
	// to be canceled.
	if len(events) > 0 {
		go h.dispatchAlerts(context.Background(), *veh, req.Latitude, req.Longitude, recordedAt, events)
	}
}

func (h *Handler) dispatchAlerts(ctx context.Context, veh models.Vehicle, lat, lng float64, occurredAt time.Time, events []geofenceEvent) {
	for _, e := range events {
		configs, err := h.alerts.FindMatching(ctx, e.geofence.GeofenceID, veh.ID, e.eventType)
		if err != nil {
			log.Printf("alert dispatch: failed to find matching configs: %v", err)
			continue
		}
		if len(configs) == 0 {
			continue
		}

		payload := models.AlertEvent{
			EventID:   ids.New("evt"),
			EventType: e.eventType,
			Timestamp: occurredAt.UTC().Format(time.RFC3339),
			Vehicle: models.AlertVehicle{
				VehicleID:     veh.ID,
				VehicleNumber: veh.VehicleNumber,
				DriverName:    veh.DriverName,
			},
			Geofence: models.AlertGeofence{
				GeofenceID:   e.geofence.GeofenceID,
				GeofenceName: e.geofence.GeofenceName,
				Category:     e.geofence.Category,
			},
			Location: models.AlertLocation{Latitude: lat, Longitude: lng},
		}
		h.hub.BroadcastJSON(payload)

		payloadJSON, err := json.Marshal(payload)
		if err != nil {
			log.Printf("alert dispatch: failed to marshal payload: %v", err)
			continue
		}
		for _, cfg := range configs {
			if err := h.alerts.LogDelivery(ctx, ids.New("evtlog"), e.violationID, cfg.ID, e.eventType, payloadJSON); err != nil {
				log.Printf("alert dispatch: failed to log delivery: %v", err)
			}
		}
	}
}

type currentLocationDTO struct {
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
}

type geofenceStatusDTO struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category"`
}

type getResponse struct {
	VehicleID        string              `json:"vehicle_id"`
	VehicleNumber    string              `json:"vehicle_number"`
	CurrentLocation  *currentLocationDTO `json:"current_location"`
	CurrentGeofences []geofenceStatusDTO `json:"current_geofences"`
	TimeNs           string              `json:"time_ns"`
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	vehicleID := chi.URLParam(r, "vehicle_id")

	ctx := r.Context()
	veh, err := h.vehicles.GetByID(ctx, vehicleID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to look up vehicle")
		return
	}
	if veh == nil {
		httpx.WriteError(w, http.StatusNotFound, start, "vehicle not found")
		return
	}

	loc, err := h.locations.LatestLocation(ctx, vehicleID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to load location")
		return
	}

	resp := getResponse{
		VehicleID:        veh.ID,
		VehicleNumber:    veh.VehicleNumber,
		CurrentGeofences: []geofenceStatusDTO{},
		TimeNs:           "", // set just before writing
	}

	if loc != nil {
		resp.CurrentLocation = &currentLocationDTO{Latitude: loc.Latitude, Longitude: loc.Longitude, Timestamp: loc.RecordedAt}

		containing, err := h.geofences.ContainingGeofences(ctx, loc.Latitude, loc.Longitude)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, start, "failed to evaluate geofences")
			return
		}
		geofences := make([]geofenceStatusDTO, 0, len(containing))
		for _, c := range containing {
			geofences = append(geofences, geofenceStatusDTO{GeofenceID: c.GeofenceID, GeofenceName: c.GeofenceName, Category: c.Category})
		}
		resp.CurrentGeofences = geofences
	}

	resp.TimeNs = httpx.ElapsedNs(start)
	httpx.WriteJSON(w, http.StatusOK, resp)
}
