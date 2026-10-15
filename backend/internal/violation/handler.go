package violation

import (
	"net/http"
	"strconv"
	"time"

	"geofencing-backend/internal/httpx"
)

const (
	defaultLimit = 50
	maxLimit     = 500
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

type violationDTO struct {
	ID            string    `json:"id"`
	VehicleID     string    `json:"vehicle_id"`
	VehicleNumber string    `json:"vehicle_number"`
	GeofenceID    string    `json:"geofence_id"`
	GeofenceName  string    `json:"geofence_name"`
	EventType     string    `json:"event_type"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	Timestamp     time.Time `json:"timestamp"`
}

type historyResponse struct {
	Violations []violationDTO `json:"violations"`
	TotalCount int            `json:"total_count"`
	TimeNs     string         `json:"time_ns"`
}

func (h *Handler) History(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	q := r.URL.Query()

	limit := defaultLimit
	if raw := q.Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 {
			httpx.WriteError(w, http.StatusBadRequest, start, "limit must be a positive integer")
			return
		}
		limit = parsed
	}
	if limit > maxLimit {
		limit = maxLimit
	}

	filter := Filter{
		VehicleID:  q.Get("vehicle_id"),
		GeofenceID: q.Get("geofence_id"),
		Limit:      limit,
	}

	if raw := q.Get("start_date"); raw != "" {
		t, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			httpx.WriteError(w, http.StatusBadRequest, start, "start_date must be ISO 8601 (e.g. 2025-01-01T00:00:00Z)")
			return
		}
		filter.StartDate = &t
	}
	if raw := q.Get("end_date"); raw != "" {
		t, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			httpx.WriteError(w, http.StatusBadRequest, start, "end_date must be ISO 8601 (e.g. 2025-01-31T23:59:59Z)")
			return
		}
		filter.EndDate = &t
	}

	views, total, err := h.repo.List(r.Context(), filter)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to fetch violation history")
		return
	}

	dtos := make([]violationDTO, 0, len(views))
	for _, v := range views {
		dtos = append(dtos, violationDTO{
			ID:            v.ID,
			VehicleID:     v.VehicleID,
			VehicleNumber: v.VehicleNumber,
			GeofenceID:    v.GeofenceID,
			GeofenceName:  v.GeofenceName,
			EventType:     v.EventType,
			Latitude:      v.Latitude,
			Longitude:     v.Longitude,
			Timestamp:     v.OccurredAt,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, historyResponse{
		Violations: dtos,
		TotalCount: total,
		TimeNs:     httpx.ElapsedNs(start),
	})
}
