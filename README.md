# Geofencing & Real-time Alert System

A full-stack geofencing and vehicle tracking system: define polygonal
geofences, register and track vehicles, get real-time alerts when a vehicle
enters or exits a geofenced zone (restricted zones in particular), and review
historical entry/exit events.

- **Backend**: Go (chi router), PostgreSQL + PostGIS for geospatial storage
  and point-in-polygon queries, a WebSocket hub for real-time alerts.
- **Frontend**: React + TypeScript (Vite), Leaflet for the interactive map,
  Tailwind CSS for styling.
- **Infra**: Docker Compose for one-command local setup (Postgres, backend,
  frontend).

See **[SETUP.md](SETUP.md)** for prerequisites, local/Docker setup, full API
curl examples, the frontend usage guide, and an architecture overview.

## Project layout

```
backend/    Go API + WebSocket server (see backend/internal for packages per resource)
frontend/   React + Vite + Leaflet dashboard
docker-compose.yml
SETUP.md
```

## Video walkthrough

_(link to be added — demo, implementation deep dive, and roadmap/limitations)_
