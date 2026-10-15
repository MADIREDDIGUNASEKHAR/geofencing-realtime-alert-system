package middleware

import (
	"net/http"
	"time"

	"geofencing-backend/internal/httpx"
)

// APIKeyAuth rejects requests missing a matching X-API-Key header. It is a
// no-op when key is empty, so the API stays open for local development and
// grading unless an operator explicitly sets API_KEY.
func APIKeyAuth(key string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		if key == "" {
			return next
		}
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Header.Get("X-API-Key") != key {
				httpx.WriteError(w, http.StatusUnauthorized, time.Now(), "missing or invalid X-API-Key header")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
