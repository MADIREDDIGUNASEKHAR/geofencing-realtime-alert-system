// Package geofence implements geofence storage and HTTP handlers.
package geofence

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
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

func (r *Repository) Create(ctx context.Context, g models.Geofence, wkt string) error {
	coordsJSON, err := json.Marshal(g.Coordinates)
	if err != nil {
		return fmt.Errorf("marshal coordinates: %w", err)
	}
	_, err = r.pool.Exec(ctx, `
		INSERT INTO geofences (id, name, description, category, coordinates, boundary, status)
		VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromText($6), 4326)::geography, $7)
	`, g.ID, g.Name, g.Description, g.Category, coordsJSON, wkt, g.Status)
	if err != nil {
		return fmt.Errorf("insert geofence: %w", err)
	}
	return nil
}

func (r *Repository) List(ctx context.Context, category string, page pagination.Params) ([]models.Geofence, error) {
	query := `SELECT id, name, description, category, coordinates, status, created_at FROM geofences`
	args := []interface{}{}
	if category != "" {
		query += ` WHERE category = $1`
		args = append(args, category)
	}
	query += ` ORDER BY created_at DESC`
	query, args = page.Apply(query, args)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query geofences: %w", err)
	}
	defer rows.Close()

	var out []models.Geofence
	for rows.Next() {
		g, err := scanGeofence(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id string) (*models.Geofence, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, name, description, category, coordinates, status, created_at
		FROM geofences WHERE id = $1
	`, id)
	g, err := scanGeofence(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &g, nil
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanGeofence(row rowScanner) (models.Geofence, error) {
	var g models.Geofence
	var coordsJSON []byte
	if err := row.Scan(&g.ID, &g.Name, &g.Description, &g.Category, &coordsJSON, &g.Status, &g.CreatedAt); err != nil {
		return models.Geofence{}, fmt.Errorf("scan geofence: %w", err)
	}
	if err := json.Unmarshal(coordsJSON, &g.Coordinates); err != nil {
		return models.Geofence{}, fmt.Errorf("unmarshal coordinates: %w", err)
	}
	return g, nil
}

// ContainingGeofences returns every active geofence whose polygon covers
// (lat, lng), using the GIST index on the boundary column for fast lookups
// even with a large number of geofences.
func (r *Repository) ContainingGeofences(ctx context.Context, lat, lng float64) ([]models.ContainingGeofence, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, category
		FROM geofences
		WHERE status = 'active'
		  AND ST_Covers(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)
	`, lng, lat)
	if err != nil {
		return nil, fmt.Errorf("query containing geofences: %w", err)
	}
	defer rows.Close()

	var out []models.ContainingGeofence
	for rows.Next() {
		var c models.ContainingGeofence
		if err := rows.Scan(&c.GeofenceID, &c.GeofenceName, &c.Category); err != nil {
			return nil, fmt.Errorf("scan containing geofence: %w", err)
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
