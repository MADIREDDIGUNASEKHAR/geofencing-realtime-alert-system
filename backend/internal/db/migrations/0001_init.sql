-- Initial schema for the geofencing & vehicle tracking system.
-- Idempotent: safe to run on every startup.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS geofences (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL CHECK (category IN ('delivery_zone', 'restricted_zone', 'toll_zone', 'customer_area')),
    coordinates JSONB NOT NULL,
    boundary    GEOGRAPHY(POLYGON, 4326) NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geofences_boundary ON geofences USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_geofences_category ON geofences (category);

CREATE TABLE IF NOT EXISTS vehicles (
    id             TEXT PRIMARY KEY,
    vehicle_number TEXT NOT NULL UNIQUE,
    driver_name    TEXT NOT NULL,
    vehicle_type   TEXT NOT NULL,
    phone          TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_locations (
    id          BIGSERIAL PRIMARY KEY,
    vehicle_id  TEXT NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    point       GEOGRAPHY(POINT, 4326) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_created ON vehicle_locations (vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_point ON vehicle_locations USING GIST (point);

-- Tracks which geofences a vehicle is currently inside, so entry/exit events
-- can be detected by diffing against the previous location update.
CREATE TABLE IF NOT EXISTS vehicle_geofence_state (
    vehicle_id  TEXT NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    geofence_id TEXT NOT NULL REFERENCES geofences (id) ON DELETE CASCADE,
    entered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (vehicle_id, geofence_id)
);

CREATE TABLE IF NOT EXISTS alert_configs (
    id          TEXT PRIMARY KEY,
    geofence_id TEXT NOT NULL REFERENCES geofences (id) ON DELETE CASCADE,
    vehicle_id  TEXT REFERENCES vehicles (id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL CHECK (event_type IN ('entry', 'exit', 'both')),
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_configs_geofence ON alert_configs (geofence_id);
CREATE INDEX IF NOT EXISTS idx_alert_configs_vehicle ON alert_configs (vehicle_id);

CREATE TABLE IF NOT EXISTS violations (
    id          TEXT PRIMARY KEY,
    vehicle_id  TEXT NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    geofence_id TEXT NOT NULL REFERENCES geofences (id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL CHECK (event_type IN ('entry', 'exit')),
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violations_vehicle ON violations (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_violations_geofence ON violations (geofence_id);
CREATE INDEX IF NOT EXISTS idx_violations_occurred ON violations (occurred_at DESC);

-- Audit log of every alert actually dispatched over the real-time channel.
CREATE TABLE IF NOT EXISTS alerts_log (
    id              TEXT PRIMARY KEY,
    violation_id    TEXT REFERENCES violations (id) ON DELETE CASCADE,
    alert_config_id TEXT REFERENCES alert_configs (id) ON DELETE SET NULL,
    event_type      TEXT NOT NULL,
    payload         JSONB NOT NULL,
    delivered_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_log_delivered ON alerts_log (delivered_at DESC);
