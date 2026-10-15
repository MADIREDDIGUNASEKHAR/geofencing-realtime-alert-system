// Package middleware holds cross-cutting HTTP middleware: rate limiting and
// optional API key authentication.
package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"geofencing-backend/internal/httpx"
)

// IPRateLimiter grants each client IP its own token bucket, so one noisy
// vehicle's tracker can't starve updates from the rest of the fleet.
type IPRateLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	rate     rate.Limit
	burst    int
}

func NewIPRateLimiter(ratePerSecond float64, burst int) *IPRateLimiter {
	return &IPRateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rate:     rate.Limit(ratePerSecond),
		burst:    burst,
	}
}

func (l *IPRateLimiter) limiterFor(key string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()
	lim, ok := l.limiters[key]
	if !ok {
		lim = rate.NewLimiter(l.rate, l.burst)
		l.limiters[key] = lim
	}
	return lim
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func (l *IPRateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !l.limiterFor(clientIP(r)).Allow() {
			httpx.WriteError(w, http.StatusTooManyRequests, time.Now(), "rate limit exceeded, slow down")
			return
		}
		next.ServeHTTP(w, r)
	})
}
