package geofence

import (
	"encoding/json"
	"net/http"
	"time"

	"geofencing-backend/internal/geo"
	"geofencing-backend/internal/httpx"
	"geofencing-backend/internal/ids"
	"geofencing-backend/internal/models"
)

var allowedCategories = map[string]bool{
	"delivery_zone":   true,
	"restricted_zone": true,
	"toll_zone":       true,
	"customer_area":   true,
}

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

type createRequest struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Coordinates [][]float64 `json:"coordinates"`
	Category    string      `json:"category"`
}

type createResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
	TimeNs string `json:"time_ns"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, "invalid JSON body")
		return
	}

	if req.Name == "" {
		httpx.WriteError(w, http.StatusBadRequest, start, "name is required")
		return
	}
	if !allowedCategories[req.Category] {
		httpx.WriteError(w, http.StatusBadRequest, start, "category must be one of: delivery_zone, restricted_zone, toll_zone, customer_area")
		return
	}

	coords := make([][2]float64, len(req.Coordinates))
	for i, pair := range req.Coordinates {
		if len(pair) != 2 {
			httpx.WriteError(w, http.StatusBadRequest, start, "each coordinate must be a [latitude, longitude] pair")
			return
		}
		coords[i] = [2]float64{pair[0], pair[1]}
	}

	if err := geo.ValidatePolygon(coords); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, err.Error())
		return
	}

	g := models.Geofence{
		ID:          ids.New("geo"),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Coordinates: coords,
		Status:      "active",
	}

	if err := h.repo.Create(r.Context(), g, geo.PolygonWKT(coords)); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to create geofence")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, createResponse{
		ID:     g.ID,
		Name:   g.Name,
		Status: g.Status,
		TimeNs: httpx.ElapsedNs(start),
	})
}

type geofenceDTO struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Coordinates [][2]float64 `json:"coordinates"`
	Category    string       `json:"category"`
	CreatedAt   time.Time    `json:"created_at"`
}

type listResponse struct {
	Geofences []geofenceDTO `json:"geofences"`
	TimeNs    string        `json:"time_ns"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	category := r.URL.Query().Get("category")

	geofences, err := h.repo.List(r.Context(), category)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to list geofences")
		return
	}

	dtos := make([]geofenceDTO, 0, len(geofences))
	for _, g := range geofences {
		dtos = append(dtos, geofenceDTO{
			ID:          g.ID,
			Name:        g.Name,
			Description: g.Description,
			Coordinates: g.Coordinates,
			Category:    g.Category,
			CreatedAt:   g.CreatedAt,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, listResponse{Geofences: dtos, TimeNs: httpx.ElapsedNs(start)})
}
