// Package httpx holds small HTTP response helpers shared by every handler,
// in particular the time_ns field required on every API response.
package httpx

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

// ElapsedNs formats the time since start as a nanosecond count, matching the
// string-encoded "time_ns" field required by the API spec.
func ElapsedNs(start time.Time) string {
	return strconv.FormatInt(time.Since(start).Nanoseconds(), 10)
}

func WriteJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

type ErrorResponse struct {
	Error  string `json:"error"`
	TimeNs string `json:"time_ns"`
}

func WriteError(w http.ResponseWriter, status int, start time.Time, message string) {
	WriteJSON(w, status, ErrorResponse{Error: message, TimeNs: ElapsedNs(start)})
}
