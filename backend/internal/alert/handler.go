package alert

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"geofencing-backend/internal/httpx"
	"geofencing-backend/internal/ids"
	"geofencing-backend/internal/models"
	"geofencing-backend/internal/pagination"
)

var allowedEventTypes = map[string]bool{"entry": true, "exit": true, "both": true}

const (
	defaultLogLimit = 50
	maxLogLimit     = 500
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

type configureRequest struct {
	GeofenceID string  `json:"geofence_id"`
	VehicleID  *string `json:"vehicle_id"`
	EventType  string  `json:"event_type"`
}

type configureResponse struct {
	AlertID    string  `json:"alert_id"`
	GeofenceID string  `json:"geofence_id"`
	VehicleID  *string `json:"vehicle_id,omitempty"`
	EventType  string  `json:"event_type"`
	Status     string  `json:"status"`
	TimeNs     string  `json:"time_ns"`
}

func (h *Handler) Configure(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req configureRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, "invalid JSON body")
		return
	}

	if req.GeofenceID == "" {
		httpx.WriteError(w, http.StatusBadRequest, start, "geofence_id is required")
		return
	}
	if !allowedEventTypes[req.EventType] {
		httpx.WriteError(w, http.StatusBadRequest, start, "event_type must be one of: entry, exit, both")
		return
	}

	geofenceExists, err := h.repo.GeofenceExists(r.Context(), req.GeofenceID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to validate geofence_id")
		return
	}
	if !geofenceExists {
		httpx.WriteError(w, http.StatusBadRequest, start, "geofence_id does not exist")
		return
	}

	if req.VehicleID != nil && *req.VehicleID != "" {
		vehicleExists, err := h.repo.VehicleExists(r.Context(), *req.VehicleID)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, start, "failed to validate vehicle_id")
			return
		}
		if !vehicleExists {
			httpx.WriteError(w, http.StatusBadRequest, start, "vehicle_id does not exist")
			return
		}
	} else {
		req.VehicleID = nil
	}

	a := models.AlertConfig{
		ID:         ids.New("alert"),
		GeofenceID: req.GeofenceID,
		VehicleID:  req.VehicleID,
		EventType:  req.EventType,
		Status:     "active",
	}

	if err := h.repo.Create(r.Context(), a); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to configure alert")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, configureResponse{
		AlertID:    a.ID,
		GeofenceID: a.GeofenceID,
		VehicleID:  a.VehicleID,
		EventType:  a.EventType,
		Status:     a.Status,
		TimeNs:     httpx.ElapsedNs(start),
	})
}

type alertDTO struct {
	AlertID       string    `json:"alert_id"`
	GeofenceID    string    `json:"geofence_id"`
	GeofenceName  string    `json:"geofence_name"`
	VehicleID     *string   `json:"vehicle_id,omitempty"`
	VehicleNumber *string   `json:"vehicle_number,omitempty"`
	EventType     string    `json:"event_type"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type listResponse struct {
	Alerts []alertDTO `json:"alerts"`
	TimeNs string     `json:"time_ns"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	q := r.URL.Query()
	geofenceID := q.Get("geofence_id")
	vehicleID := q.Get("vehicle_id")

	page, pageErr := pagination.Parse(q.Get("limit"), q.Get("offset"))
	if pageErr != "" {
		httpx.WriteError(w, http.StatusBadRequest, start, pageErr)
		return
	}

	views, err := h.repo.List(r.Context(), geofenceID, vehicleID, page)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to list alerts")
		return
	}

	dtos := make([]alertDTO, 0, len(views))
	for _, v := range views {
		dtos = append(dtos, alertDTO{
			AlertID:       v.ID,
			GeofenceID:    v.GeofenceID,
			GeofenceName:  v.GeofenceName,
			VehicleID:     v.VehicleID,
			VehicleNumber: v.VehicleNumber,
			EventType:     v.EventType,
			Status:        v.Status,
			CreatedAt:     v.CreatedAt,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, listResponse{Alerts: dtos, TimeNs: httpx.ElapsedNs(start)})
}

type alertLogDTO struct {
	ID            string               `json:"id"`
	AlertConfigID *string              `json:"alert_config_id,omitempty"`
	EventType     string               `json:"event_type"`
	DeliveredAt   time.Time            `json:"delivered_at"`
	Vehicle       models.AlertVehicle  `json:"vehicle"`
	Geofence      models.AlertGeofence `json:"geofence"`
	Location      models.AlertLocation `json:"location"`
}

type logHistoryResponse struct {
	Alerts     []alertLogDTO `json:"alerts"`
	TotalCount int           `json:"total_count"`
	TimeNs     string        `json:"time_ns"`
}

// History returns alerts that were actually dispatched over /ws/alerts, so a
// client that missed the live push (e.g. wasn't connected yet) can catch up
// on exactly what was sent, distinct from GET /violations/history which
// includes every entry/exit event even when no alert rule matched it.
func (h *Handler) History(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	q := r.URL.Query()
	geofenceID := q.Get("geofence_id")
	vehicleID := q.Get("vehicle_id")

	limit := defaultLogLimit
	if raw := q.Get("limit"); raw != "" {
		v, err := strconv.Atoi(raw)
		if err != nil || v < 1 {
			httpx.WriteError(w, http.StatusBadRequest, start, "limit must be a positive integer")
			return
		}
		limit = v
	}
	if limit > maxLogLimit {
		limit = maxLogLimit
	}
	offset := 0
	if raw := q.Get("offset"); raw != "" {
		v, err := strconv.Atoi(raw)
		if err != nil || v < 0 {
			httpx.WriteError(w, http.StatusBadRequest, start, "offset must be a non-negative integer")
			return
		}
		offset = v
	}

	records, total, err := h.repo.ListLog(r.Context(), geofenceID, vehicleID, pagination.Params{Limit: limit, Offset: offset})
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to fetch alert history")
		return
	}

	dtos := make([]alertLogDTO, 0, len(records))
	for _, rec := range records {
		dtos = append(dtos, alertLogDTO{
			ID:            rec.ID,
			AlertConfigID: rec.AlertConfigID,
			EventType:     rec.EventType,
			DeliveredAt:   rec.DeliveredAt,
			Vehicle:       rec.Event.Vehicle,
			Geofence:      rec.Event.Geofence,
			Location:      rec.Event.Location,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, logHistoryResponse{Alerts: dtos, TotalCount: total, TimeNs: httpx.ElapsedNs(start)})
}
