// Command api runs the geofencing & vehicle tracking HTTP + WebSocket server.
package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"geofencing-backend/internal/alert"
	"geofencing-backend/internal/config"
	"geofencing-backend/internal/db"
	"geofencing-backend/internal/geofence"
	"geofencing-backend/internal/location"
	"geofencing-backend/internal/middleware"
	"geofencing-backend/internal/vehicle"
	"geofencing-backend/internal/violation"
	"geofencing-backend/internal/ws"
)

func main() {
	_ = godotenv.Load() // optional: ignore error when no .env file is present

	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	hub := ws.NewHub()
	go hub.Run()

	geofenceRepo := geofence.NewRepository(pool)
	vehicleRepo := vehicle.NewRepository(pool)
	alertRepo := alert.NewRepository(pool)
	violationRepo := violation.NewRepository(pool)
	locationRepo := location.NewRepository(pool)

	geofenceHandler := geofence.NewHandler(geofenceRepo)
	vehicleHandler := vehicle.NewHandler(vehicleRepo)
	alertHandler := alert.NewHandler(alertRepo)
	violationHandler := violation.NewHandler(violationRepo)
	locationHandler := location.NewHandler(locationRepo, vehicleRepo, geofenceRepo, alertRepo, violationRepo, hub)

	// 5 req/sec per IP with bursts up to 20 keeps a single misbehaving
	// tracker from drowning out the rest of the fleet's location updates.
	locationLimiter := middleware.NewIPRateLimiter(5, 20)
	apiKeyAuth := middleware.APIKeyAuth(cfg.APIKey)

	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "X-API-Key"},
		MaxAge:         300,
	}))

	r.Get("/healthz", healthHandler)
	r.Get("/ws/alerts", func(w http.ResponseWriter, req *http.Request) { ws.ServeWS(hub, w, req) })

	r.Group(func(r chi.Router) {
		r.Use(apiKeyAuth)

		r.Post("/geofences", geofenceHandler.Create)
		r.Get("/geofences", geofenceHandler.List)

		r.Post("/vehicles", vehicleHandler.Create)
		r.Get("/vehicles", vehicleHandler.List)

		r.With(locationLimiter.Limit).Post("/vehicles/location", locationHandler.Update)
		r.Get("/vehicles/location/{vehicle_id}", locationHandler.Get)

		r.Post("/alerts/configure", alertHandler.Configure)
		r.Get("/alerts", alertHandler.List)

		r.Get("/violations/history", violationHandler.History)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("geofencing API listening on :%s", cfg.Port)
	log.Fatal(srv.ListenAndServe())
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}
