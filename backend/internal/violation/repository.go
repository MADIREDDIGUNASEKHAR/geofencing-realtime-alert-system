// Package violation implements historical entry/exit event storage and HTTP handlers.
package violation

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"geofencing-backend/internal/models"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// execer is satisfied by both *pgxpool.Pool and pgx.Tx, letting Insert
// participate in the caller's transaction when one is supplied.
type execer interface {
	Exec(ctx context.Context, sql string, args ...interface{}) (pgconn.CommandTag, error)
}

// Insert records an entry/exit event. Called synchronously as part of the
// location-update transaction so history is immediately queryable.
func (r *Repository) Insert(ctx context.Context, exec execer, v models.Violation) error {
	_, err := exec.Exec(ctx, `
		INSERT INTO violations (id, vehicle_id, geofence_id, event_type, latitude, longitude, occurred_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, v.ID, v.VehicleID, v.GeofenceID, v.EventType, v.Latitude, v.Longitude, v.OccurredAt)
	if err != nil {
		return fmt.Errorf("insert violation: %w", err)
	}
	return nil
}

type Filter struct {
	VehicleID  string
	GeofenceID string
	StartDate  *time.Time
	EndDate    *time.Time
	Limit      int
}

func (r *Repository) List(ctx context.Context, f Filter) ([]models.ViolationView, int, error) {
	where := "WHERE 1 = 1"
	args := []interface{}{}

	if f.VehicleID != "" {
		args = append(args, f.VehicleID)
		where += fmt.Sprintf(" AND v.vehicle_id = $%d", len(args))
	}
	if f.GeofenceID != "" {
		args = append(args, f.GeofenceID)
		where += fmt.Sprintf(" AND v.geofence_id = $%d", len(args))
	}
	if f.StartDate != nil {
		args = append(args, *f.StartDate)
		where += fmt.Sprintf(" AND v.occurred_at >= $%d", len(args))
	}
	if f.EndDate != nil {
		args = append(args, *f.EndDate)
		where += fmt.Sprintf(" AND v.occurred_at <= $%d", len(args))
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM violations v " + where
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count violations: %w", err)
	}

	args = append(args, f.Limit)
	query := fmt.Sprintf(`
		SELECT v.id, v.vehicle_id, veh.vehicle_number, v.geofence_id, g.name, v.event_type, v.latitude, v.longitude, v.occurred_at
		FROM violations v
		JOIN vehicles veh ON veh.id = v.vehicle_id
		JOIN geofences g ON g.id = v.geofence_id
		%s
		ORDER BY v.occurred_at DESC
		LIMIT $%d
	`, where, len(args))

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query violations: %w", err)
	}
	defer rows.Close()

	var out []models.ViolationView
	for rows.Next() {
		var v models.ViolationView
		if err := rows.Scan(&v.ID, &v.VehicleID, &v.VehicleNumber, &v.GeofenceID, &v.GeofenceName, &v.EventType, &v.Latitude, &v.Longitude, &v.OccurredAt); err != nil {
			return nil, 0, fmt.Errorf("scan violation: %w", err)
		}
		out = append(out, v)
	}
	return out, total, rows.Err()
}
