// Package vehicle implements vehicle registration storage and HTTP handlers.
package vehicle

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"geofencing-backend/internal/models"
)

var ErrDuplicateVehicleNumber = errors.New("vehicle_number already registered")

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, v models.Vehicle) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO vehicles (id, vehicle_number, driver_name, vehicle_type, phone, status)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, v.ID, v.VehicleNumber, v.DriverName, v.VehicleType, v.Phone, v.Status)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrDuplicateVehicleNumber
		}
		return fmt.Errorf("insert vehicle: %w", err)
	}
	return nil
}

func (r *Repository) List(ctx context.Context) ([]models.Vehicle, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
		FROM vehicles ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("query vehicles: %w", err)
	}
	defer rows.Close()

	var out []models.Vehicle
	for rows.Next() {
		v, err := scanVehicle(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id string) (*models.Vehicle, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
		FROM vehicles WHERE id = $1
	`, id)
	v, err := scanVehicle(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanVehicle(row rowScanner) (models.Vehicle, error) {
	var v models.Vehicle
	if err := row.Scan(&v.ID, &v.VehicleNumber, &v.DriverName, &v.VehicleType, &v.Phone, &v.Status, &v.CreatedAt); err != nil {
		return models.Vehicle{}, fmt.Errorf("scan vehicle: %w", err)
	}
	return v, nil
}
