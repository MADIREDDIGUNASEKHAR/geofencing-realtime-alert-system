// Package alert implements alert rule configuration storage and HTTP handlers.
package alert

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"geofencing-backend/internal/models"
	"geofencing-backend/internal/pagination"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, a models.AlertConfig) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO alert_configs (id, geofence_id, vehicle_id, event_type, status)
		VALUES ($1, $2, $3, $4, $5)
	`, a.ID, a.GeofenceID, a.VehicleID, a.EventType, a.Status)
	if err != nil {
		return fmt.Errorf("insert alert config: %w", err)
	}
	return nil
}

func (r *Repository) List(ctx context.Context, geofenceID, vehicleID string, page pagination.Params) ([]models.AlertConfigView, error) {
	query := `
		SELECT a.id, a.geofence_id, g.name, a.vehicle_id, v.vehicle_number, a.event_type, a.status, a.created_at
		FROM alert_configs a
		JOIN geofences g ON g.id = a.geofence_id
		LEFT JOIN vehicles v ON v.id = a.vehicle_id
		WHERE 1 = 1
	`
	args := []interface{}{}
	if geofenceID != "" {
		args = append(args, geofenceID)
		query += fmt.Sprintf(" AND a.geofence_id = $%d", len(args))
	}
	if vehicleID != "" {
		args = append(args, vehicleID)
		query += fmt.Sprintf(" AND a.vehicle_id = $%d", len(args))
	}
	query += " ORDER BY a.created_at DESC"
	query, args = page.Apply(query, args)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query alert configs: %w", err)
	}
	defer rows.Close()

	var out []models.AlertConfigView
	for rows.Next() {
		var v models.AlertConfigView
		if err := rows.Scan(&v.ID, &v.GeofenceID, &v.GeofenceName, &v.VehicleID, &v.VehicleNumber, &v.EventType, &v.Status, &v.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan alert config: %w", err)
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

// FindMatching returns every active alert rule that should fire for the
// given geofence/vehicle/event combination: rules scoped to this exact
// vehicle, plus "all vehicles" rules (vehicle_id IS NULL), whose event_type
// matches either exactly or via "both".
func (r *Repository) FindMatching(ctx context.Context, geofenceID, vehicleID, eventType string) ([]models.AlertConfig, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, geofence_id, vehicle_id, event_type, status
		FROM alert_configs
		WHERE status = 'active'
		  AND geofence_id = $1
		  AND (vehicle_id IS NULL OR vehicle_id = $2)
		  AND (event_type = $3 OR event_type = 'both')
	`, geofenceID, vehicleID, eventType)
	if err != nil {
		return nil, fmt.Errorf("query matching alert configs: %w", err)
	}
	defer rows.Close()

	var out []models.AlertConfig
	for rows.Next() {
		var a models.AlertConfig
		if err := rows.Scan(&a.ID, &a.GeofenceID, &a.VehicleID, &a.EventType, &a.Status); err != nil {
			return nil, fmt.Errorf("scan matching alert config: %w", err)
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *Repository) GeofenceExists(ctx context.Context, geofenceID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM geofences WHERE id = $1)`, geofenceID).Scan(&exists)
	return exists, err
}

func (r *Repository) VehicleExists(ctx context.Context, vehicleID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM vehicles WHERE id = $1)`, vehicleID).Scan(&exists)
	return exists, err
}

// LogEntry is one dispatched alert, reconstructed from its stored WebSocket
// payload plus delivery metadata.
type LogEntry struct {
	ID            string
	AlertConfigID *string
	EventType     string
	DeliveredAt   time.Time
	Event         models.AlertEvent
}

// ListLog returns dispatched alerts (what was actually broadcast over
// /ws/alerts), filterable by geofence/vehicle, newest first. This lets a
// client that missed the live push catch up on exactly what was sent,
// distinct from ListViolations' full entry/exit history which includes
// events that had no matching alert rule at all.
func (r *Repository) ListLog(ctx context.Context, geofenceID, vehicleID string, page pagination.Params) ([]LogEntry, int, error) {
	where := "WHERE 1 = 1"
	args := []interface{}{}
	if geofenceID != "" {
		args = append(args, geofenceID)
		where += fmt.Sprintf(" AND payload->'geofence'->>'geofence_id' = $%d", len(args))
	}
	if vehicleID != "" {
		args = append(args, vehicleID)
		where += fmt.Sprintf(" AND payload->'vehicle'->>'vehicle_id' = $%d", len(args))
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM alerts_log " + where
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count alerts log: %w", err)
	}

	query := "SELECT id, alert_config_id, event_type, payload, delivered_at FROM alerts_log " + where + " ORDER BY delivered_at DESC"
	query, args = page.Apply(query, args)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query alerts log: %w", err)
	}
	defer rows.Close()

	var out []LogEntry
	for rows.Next() {
		var entry LogEntry
		var payload []byte
		if err := rows.Scan(&entry.ID, &entry.AlertConfigID, &entry.EventType, &payload, &entry.DeliveredAt); err != nil {
			return nil, 0, fmt.Errorf("scan alerts log: %w", err)
		}
		if err := json.Unmarshal(payload, &entry.Event); err != nil {
			return nil, 0, fmt.Errorf("unmarshal alert payload: %w", err)
		}
		out = append(out, entry)
	}
	return out, total, rows.Err()
}

// LogDelivery records a dispatched alert for the historical audit trail.
func (r *Repository) LogDelivery(ctx context.Context, id, violationID, alertConfigID, eventType string, payload []byte) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO alerts_log (id, violation_id, alert_config_id, event_type, payload)
		VALUES ($1, $2, $3, $4, $5)
	`, id, violationID, alertConfigID, eventType, payload)
	if err != nil {
		return fmt.Errorf("insert alert log: %w", err)
	}
	return nil
}
