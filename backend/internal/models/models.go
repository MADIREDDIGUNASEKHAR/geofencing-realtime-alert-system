// Package models holds domain types shared across resource packages.
package models

import "time"

type Geofence struct {
	ID          string
	Name        string
	Description string
	Category    string
	Coordinates [][2]float64 // [latitude, longitude] pairs
	Status      string
	CreatedAt   time.Time
}

type Vehicle struct {
	ID            string
	VehicleNumber string
	DriverName    string
	VehicleType   string
	Phone         string
	Status        string
	CreatedAt     time.Time
}

type Location struct {
	VehicleID  string
	Latitude   float64
	Longitude  float64
	RecordedAt time.Time
}

// ContainingGeofence is a geofence found to currently contain a point.
type ContainingGeofence struct {
	GeofenceID   string
	GeofenceName string
	Category     string
}

type AlertConfig struct {
	ID         string
	GeofenceID string
	VehicleID  *string // nil means "applies to all vehicles"
	EventType  string  // entry | exit | both
	Status     string
	CreatedAt  time.Time
}

type AlertConfigView struct {
	AlertConfig
	GeofenceName  string
	VehicleNumber *string
}

type Violation struct {
	ID         string
	VehicleID  string
	GeofenceID string
	EventType  string // entry | exit
	Latitude   float64
	Longitude  float64
	OccurredAt time.Time
}

type ViolationView struct {
	Violation
	VehicleNumber string
	GeofenceName  string
}

// AlertEvent is the payload broadcast to connected WebSocket clients and
// persisted to alerts_log, matching the API spec's wire format exactly.
type AlertEvent struct {
	EventID   string        `json:"event_id"`
	EventType string        `json:"event_type"`
	Timestamp string        `json:"timestamp"`
	Vehicle   AlertVehicle  `json:"vehicle"`
	Geofence  AlertGeofence `json:"geofence"`
	Location  AlertLocation `json:"location"`
}

type AlertVehicle struct {
	VehicleID     string `json:"vehicle_id"`
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
}

type AlertGeofence struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category"`
}

type AlertLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
