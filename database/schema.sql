CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    device VARCHAR(100),
    rack INTEGER NOT NULL,
    temperature NUMERIC(6,2) NOT NULL,
    humidity NUMERIC(6,2) NOT NULL,
    cpu_load NUMERIC(6,2) NOT NULL,
    airflow NUMERIC(6,2) NOT NULL,
    power_kw NUMERIC(8,2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT telemetry_rack_positive
        CHECK (rack > 0),

    CONSTRAINT telemetry_humidity_range
        CHECK (humidity >= 0 AND humidity <= 100),

    CONSTRAINT telemetry_cpu_range
        CHECK (cpu_load >= 0 AND cpu_load <= 100),

    CONSTRAINT telemetry_airflow_range
        CHECK (airflow >= 0 AND airflow <= 100),

    CONSTRAINT telemetry_power_range
        CHECK (power_kw >= 0 AND power_kw <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_rack
    ON telemetry (rack);

CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at
    ON telemetry (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_rack_recorded_at
    ON telemetry (rack, recorded_at DESC);