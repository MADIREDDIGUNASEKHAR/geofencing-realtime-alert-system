package geofence

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"geofencing-backend/internal/geo"
	"geofencing-backend/internal/httpx"
	"geofencing-backend/internal/ids"
	"geofencing-backend/internal/models"
	"geofencing-backend/internal/pagination"
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

type geofenceInput struct {
	Name        string
	Description string
	Category    string
	Coordinates [][2]float64
}

// parseGeofenceInput decodes and validates a create/update request body,
// shared by Create and Update so both enforce the same rules.
func parseGeofenceInput(r *http.Request) (geofenceInput, string, error) {
	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return geofenceInput{}, "", errors.New("invalid JSON body")
	}

	if req.Name == "" {
		return geofenceInput{}, "", errors.New("name is required")
	}
	if !allowedCategories[req.Category] {
		return geofenceInput{}, "", errors.New("category must be one of: delivery_zone, restricted_zone, toll_zone, customer_area")
	}

	coords := make([][2]float64, len(req.Coordinates))
	for i, pair := range req.Coordinates {
		if len(pair) != 2 {
			return geofenceInput{}, "", errors.New("each coordinate must be a [latitude, longitude] pair")
		}
		coords[i] = [2]float64{pair[0], pair[1]}
	}

	if err := geo.ValidatePolygon(coords); err != nil {
		return geofenceInput{}, "", err
	}

	return geofenceInput{
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Coordinates: coords,
	}, geo.PolygonWKT(coords), nil
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	input, wkt, err := parseGeofenceInput(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, err.Error())
		return
	}

	g := models.Geofence{
		ID:          ids.New("geo"),
		Name:        input.Name,
		Description: input.Description,
		Category:    input.Category,
		Coordinates: input.Coordinates,
		Status:      "active",
	}

	if err := h.repo.Create(r.Context(), g, wkt); err != nil {
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

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	id := chi.URLParam(r, "id")

	input, wkt, err := parseGeofenceInput(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, err.Error())
		return
	}

	g := models.Geofence{
		ID:          id,
		Name:        input.Name,
		Description: input.Description,
		Category:    input.Category,
		Coordinates: input.Coordinates,
	}

	found, err := h.repo.Update(r.Context(), g, wkt)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to update geofence")
		return
	}
	if !found {
		httpx.WriteError(w, http.StatusNotFound, start, "geofence not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, createResponse{
		ID:     g.ID,
		Name:   g.Name,
		Status: "active",
		TimeNs: httpx.ElapsedNs(start),
	})
}

type deleteResponse struct {
	ID      string `json:"id"`
	Deleted bool   `json:"deleted"`
	TimeNs  string `json:"time_ns"`
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	id := chi.URLParam(r, "id")

	found, err := h.repo.Delete(r.Context(), id)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to delete geofence")
		return
	}
	if !found {
		httpx.WriteError(w, http.StatusNotFound, start, "geofence not found")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, deleteResponse{
		ID:      id,
		Deleted: true,
		TimeNs:  httpx.ElapsedNs(start),
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
	q := r.URL.Query()
	category := q.Get("category")

	page, pageErr := pagination.Parse(q.Get("limit"), q.Get("offset"))
	if pageErr != "" {
		httpx.WriteError(w, http.StatusBadRequest, start, pageErr)
		return
	}

	geofences, err := h.repo.List(r.Context(), category, page)
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
