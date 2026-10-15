# Setup Guide

Geofencing & Real-time Vehicle Tracking System — Go backend, React (Vite) frontend,
PostgreSQL/PostGIS, WebSocket alerts.

## Prerequisites

- Docker & Docker Compose (recommended path — no local Go/Node/Postgres needed)
- Or, for local (non-Docker) development:
  - Go 1.22+
  - Node.js 20+
  - PostgreSQL 14+ with the PostGIS extension available

## Quick start with Docker Compose

From the repository root:

```bash
docker compose up -d --build
```

This starts three services:

| Service  | URL                     | Notes                                   |
|----------|-------------------------|------------------------------------------|
| postgres | localhost:5432          | `postgis/postgis` image, auto-migrated   |
| backend  | http://localhost:8080   | REST API + `/ws/alerts` WebSocket        |
| frontend | http://localhost:5173   | Static build served by nginx             |

The backend applies its schema migration automatically on startup (idempotent —
safe to restart). Check readiness with:

```bash
curl http://localhost:8080/healthz
# {"status":"ok"}
```

Open the dashboard at **http://localhost:5173**.

To stop everything: `docker compose down` (add `-v` to also drop the Postgres volume).

## Local development (without Docker)

### Backend

```bash
cd backend
cp .env.example .env
# edit .env if your Postgres isn't the default local instance
go mod tidy
go run ./cmd/api
```

The server listens on `:8080` (configurable via `PORT`) and requires a reachable
Postgres instance with the PostGIS extension installable (`CREATE EXTENSION
postgis` is run automatically — the connecting role needs permission to do so,
which the default `postgres` superuser has).

Run the unit tests:

```bash
go test ./...
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite serves the dev server on `http://localhost:5173` and proxies API calls to
`VITE_API_BASE_URL` (default `http://localhost:8080`).

## Configuration

### Backend environment variables (`backend/.env`)

| Variable       | Default                                                              | Purpose                                                   |
|----------------|-----------------------------------------------------------------------|------------------------------------------------------------|
| `PORT`         | `8080`                                                                 | HTTP port                                                   |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/geofencing?sslmode=disable` | Postgres connection string                                  |
| `API_KEY`      | *(empty)*                                                              | If set, every REST endpoint except `/healthz` and `/ws/alerts` requires a matching `X-API-Key` header (bonus auth) |

### Frontend environment variables (`frontend/.env`)

| Variable             | Default                                | Purpose                                   |
|----------------------|-----------------------------------------|---------------------------------------------|
| `VITE_API_BASE_URL`  | `http://localhost:8080`                 | Base URL for REST calls                      |
| `VITE_WS_URL`        | derived from `VITE_API_BASE_URL`        | Override the `/ws/alerts` WebSocket URL      |
| `VITE_API_KEY`       | *(empty)*                               | Sent as `X-API-Key` if the backend requires it |

## API testing guide (curl)

All responses include a `time_ns` field (string, nanoseconds) measuring handler
execution time.

```bash
BASE=http://localhost:8080

# 1. Create a restricted-zone geofence
curl -s -X POST $BASE/geofences -H "Content-Type: application/json" -d '{
  "name": "Downtown Restricted Zone",
  "description": "No entry for delivery trucks",
  "coordinates": [[37.7749,-122.4194],[37.7849,-122.4194],[37.7849,-122.4094],[37.7749,-122.4094],[37.7749,-122.4194]],
  "category": "restricted_zone"
}'
# => {"id":"geo_...","name":"Downtown Restricted Zone","status":"active","time_ns":"..."}

# 2. List geofences (optionally filter by category)
curl -s "$BASE/geofences?category=restricted_zone"

# 3. Register a vehicle
curl -s -X POST $BASE/vehicles -H "Content-Type: application/json" -d '{
  "vehicle_number": "KA-01-AB-1234",
  "driver_name": "John Doe",
  "vehicle_type": "truck",
  "phone": "+1234567890"
}'
# => {"id":"veh_...","vehicle_number":"KA-01-AB-1234","status":"active","time_ns":"..."}

# 4. List vehicles
curl -s "$BASE/vehicles"

# 5. Configure an alert rule (omit vehicle_id to apply to all vehicles)
curl -s -X POST $BASE/alerts/configure -H "Content-Type: application/json" -d '{
  "geofence_id": "geo_...",
  "event_type": "entry"
}'

# 6. List alert rules
curl -s "$BASE/alerts"

# 7. Update a vehicle's location (this is what triggers entry/exit detection
#    and, if a matching rule exists, a real-time alert over /ws/alerts)
curl -s -X POST $BASE/vehicles/location -H "Content-Type: application/json" -d '{
  "vehicle_id": "veh_...",
  "latitude": 37.7800,
  "longitude": -122.4150,
  "timestamp": "2025-01-15T10:35:00Z"
}'
# => {"vehicle_id":"veh_...","location_updated":true,"current_geofences":[{"geofence_id":"geo_...","geofence_name":"Downtown Restricted Zone","status":"inside"}],"time_ns":"..."}

# 8. Get a vehicle's current location + geofence status
curl -s "$BASE/vehicles/location/veh_..."

# 9. View violation (entry/exit) history, with optional filters
curl -s "$BASE/violations/history?vehicle_id=veh_...&limit=50"
```

### Watching real-time alerts

Connect any WebSocket client to `ws://localhost:8080/ws/alerts`. Every time a
location update (step 7 above) causes an entry/exit that matches a configured
alert rule, all connected clients receive a JSON message:

```json
{
  "event_id": "evt_...",
  "event_type": "entry",
  "timestamp": "2025-01-15T10:35:00Z",
  "vehicle": { "vehicle_id": "veh_...", "vehicle_number": "KA-01-AB-1234", "driver_name": "John Doe" },
  "geofence": { "geofence_id": "geo_...", "geofence_name": "Downtown Restricted Zone", "category": "restricted_zone" },
  "location": { "latitude": 37.78, "longitude": -122.415 }
}
```

A quick way to watch it from the command line (requires `websocat` or similar):

```bash
websocat ws://localhost:8080/ws/alerts
```

## Frontend usage guide

- **Dashboard** — map of all geofences and currently-tracked vehicles, plus a
  live alerts feed fed by the WebSocket connection (status shown in the top bar).
- **Geofences** — click points on the map (in order) to draw a polygon, or
  paste `[[lat,lng], ...]` JSON, then save with a name/category/description.
  Filter the list by category.
- **Vehicles** — register a vehicle and view its current location/geofence
  status on demand.
- **Tracking** — pick a vehicle, click the map (or type coordinates) to set
  its new location, and submit. The response shows which geofences the
  vehicle now sits inside; matching alert rules fire a toast in real time.
- **Alerts** — configure entry/exit/both rules per geofence, optionally
  scoped to one vehicle, and review existing rules.
- **History** — paginated, filterable table of all recorded entry/exit events.

## Architecture overview

```
frontend (React + Vite + Leaflet)
   │  REST (fetch) + WebSocket
   ▼
backend (Go, chi router)
   ├── geofence / vehicle / alert / violation — HTTP handlers + repositories
   ├── location — orchestrates: insert point → PostGIS containment query →
   │              diff against vehicle_geofence_state → write violations →
   │              commit → respond → (async) dispatch alerts over the hub
   └── ws.Hub — fan-out broadcaster for /ws/alerts, one goroutine per client
   │
   ▼
PostgreSQL + PostGIS
   - geofences.boundary: GEOGRAPHY(POLYGON), GIST-indexed
   - ST_Covers(boundary, point) does the point-in-polygon containment check
   - vehicle_geofence_state tracks "currently inside" per vehicle, diffed on
     each update to detect entry/exit transitions
```

Key design choices, for context:

- **Point-in-polygon** is delegated to PostGIS (`ST_Covers` against a
  GIST-indexed `geography` column) rather than reimplemented in Go, so lookups
  stay fast as the number of geofences grows (the recommended, scalable
  approach per the assessment brief).
- **Alert delivery is asynchronous**: the location-update transaction (insert
  point, diff state, write violation rows) commits and the HTTP response is
  sent before alert-rule matching and WebSocket broadcast happen in a
  goroutine, so a slow/stuck client never adds latency to location updates.
- **IDs** are short random prefixed strings (`geo_...`, `veh_...`, etc.)
  generated in the application layer rather than exposing database sequence
  numbers.
