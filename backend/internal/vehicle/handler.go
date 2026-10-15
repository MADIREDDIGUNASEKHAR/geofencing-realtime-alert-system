package vehicle

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"geofencing-backend/internal/httpx"
	"geofencing-backend/internal/ids"
	"geofencing-backend/internal/models"
	"geofencing-backend/internal/pagination"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

type createRequest struct {
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
	VehicleType   string `json:"vehicle_type"`
	Phone         string `json:"phone"`
}

type createResponse struct {
	ID            string `json:"id"`
	VehicleNumber string `json:"vehicle_number"`
	Status        string `json:"status"`
	TimeNs        string `json:"time_ns"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, start, "invalid JSON body")
		return
	}

	switch {
	case req.VehicleNumber == "":
		httpx.WriteError(w, http.StatusBadRequest, start, "vehicle_number is required")
		return
	case req.DriverName == "":
		httpx.WriteError(w, http.StatusBadRequest, start, "driver_name is required")
		return
	case req.VehicleType == "":
		httpx.WriteError(w, http.StatusBadRequest, start, "vehicle_type is required")
		return
	case req.Phone == "":
		httpx.WriteError(w, http.StatusBadRequest, start, "phone is required")
		return
	}

	v := models.Vehicle{
		ID:            ids.New("veh"),
		VehicleNumber: req.VehicleNumber,
		DriverName:    req.DriverName,
		VehicleType:   req.VehicleType,
		Phone:         req.Phone,
		Status:        "active",
	}

	if err := h.repo.Create(r.Context(), v); err != nil {
		if errors.Is(err, ErrDuplicateVehicleNumber) {
			httpx.WriteError(w, http.StatusConflict, start, ErrDuplicateVehicleNumber.Error())
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to register vehicle")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, createResponse{
		ID:            v.ID,
		VehicleNumber: v.VehicleNumber,
		Status:        v.Status,
		TimeNs:        httpx.ElapsedNs(start),
	})
}

type vehicleDTO struct {
	ID            string    `json:"id"`
	VehicleNumber string    `json:"vehicle_number"`
	DriverName    string    `json:"driver_name"`
	VehicleType   string    `json:"vehicle_type"`
	Phone         string    `json:"phone"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type listResponse struct {
	Vehicles []vehicleDTO `json:"vehicles"`
	TimeNs   string       `json:"time_ns"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	q := r.URL.Query()

	page, pageErr := pagination.Parse(q.Get("limit"), q.Get("offset"))
	if pageErr != "" {
		httpx.WriteError(w, http.StatusBadRequest, start, pageErr)
		return
	}

	vehicles, err := h.repo.List(r.Context(), page)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, start, "failed to list vehicles")
		return
	}

	dtos := make([]vehicleDTO, 0, len(vehicles))
	for _, v := range vehicles {
		dtos = append(dtos, vehicleDTO{
			ID:            v.ID,
			VehicleNumber: v.VehicleNumber,
			DriverName:    v.DriverName,
			VehicleType:   v.VehicleType,
			Phone:         v.Phone,
			Status:        v.Status,
			CreatedAt:     v.CreatedAt,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, listResponse{Vehicles: dtos, TimeNs: httpx.ElapsedNs(start)})
}
