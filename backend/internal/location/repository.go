// Package location implements vehicle location updates: storing points,
// diffing against the previous geofence state to detect entry/exit events,
// and dispatching real-time alerts for them.
package location

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"geofencing-backend/internal/models"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) InsertLocation(ctx context.Context, tx pgx.Tx, loc models.Location) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, point, recorded_at)
		VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography, $4)
	`, loc.VehicleID, loc.Latitude, loc.Longitude, loc.RecordedAt)
	if err != nil {
		return fmt.Errorf("insert vehicle location: %w", err)
	}
	return nil
}

// LatestLocation returns the most recently inserted location for a vehicle
// (by insertion order, so it reflects the latest API call even if historical
// backfilled timestamps are out of order).
func (r *Repository) LatestLocation(ctx context.Context, vehicleID string) (*models.Location, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT vehicle_id, latitude, longitude, recorded_at
		FROM vehicle_locations
		WHERE vehicle_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`, vehicleID)
	var loc models.Location
	if err := row.Scan(&loc.VehicleID, &loc.Latitude, &loc.Longitude, &loc.RecordedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("scan latest location: %w", err)
	}
	return &loc, nil
}

// CurrentGeofenceIDs returns the geofences the vehicle was inside as of the
// previous location update.
func (r *Repository) CurrentGeofenceIDs(ctx context.Context, tx pgx.Tx, vehicleID string) (map[string]bool, error) {
	rows, err := tx.Query(ctx, `SELECT geofence_id FROM vehicle_geofence_state WHERE vehicle_id = $1`, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("query geofence state: %w", err)
	}
	defer rows.Close()

	out := map[string]bool{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan geofence state: %w", err)
		}
		out[id] = true
	}
	return out, rows.Err()
}

func (r *Repository) SetGeofenceState(ctx context.Context, tx pgx.Tx, vehicleID, geofenceID string) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO vehicle_geofence_state (vehicle_id, geofence_id)
		VALUES ($1, $2)
		ON CONFLICT (vehicle_id, geofence_id) DO NOTHING
	`, vehicleID, geofenceID)
	return err
}

func (r *Repository) ClearGeofenceState(ctx context.Context, tx pgx.Tx, vehicleID, geofenceID string) error {
	_, err := tx.Exec(ctx, `
		DELETE FROM vehicle_geofence_state WHERE vehicle_id = $1 AND geofence_id = $2
	`, vehicleID, geofenceID)
	return err
}

func (r *Repository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.pool.Begin(ctx)
}
