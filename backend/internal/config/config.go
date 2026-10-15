// Package config loads runtime configuration from environment variables.
package config

import "os"

type Config struct {
	Port        string
	DatabaseURL string
	// APIKey, when non-empty, enables X-API-Key authentication on write endpoints.
	APIKey string
}

func Load() Config {
	return Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/geofencing?sslmode=disable"),
		APIKey:      os.Getenv("API_KEY"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
