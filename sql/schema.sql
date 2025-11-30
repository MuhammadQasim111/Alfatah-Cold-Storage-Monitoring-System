-- =====================================================
-- Smart Cold Storage Monitoring System - Database Schema
-- =====================================================
-- This schema supports a complete IoT monitoring system for cold storage units
-- with real-time sensor readings, threshold-based alerting, and historical data tracking.

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS alert CASCADE;
DROP TABLE IF EXISTS reading CASCADE;
DROP TABLE IF EXISTS threshold CASCADE;
DROP TABLE IF EXISTS sensor CASCADE;
DROP TABLE IF EXISTS storage_unit CASCADE;

-- =====================================================
-- Table: storage_unit
-- =====================================================
-- Stores metadata about each cold storage unit in the warehouse
CREATE TABLE storage_unit (
    unit_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    product_type VARCHAR(100) NOT NULL,  -- e.g., 'Frozen Foods', 'Dairy', 'Vegetables'
    location VARCHAR(100) NOT NULL,       -- Physical location in warehouse
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- =====================================================
-- Table: sensor
-- =====================================================
-- Stores metadata about sensors deployed in each storage unit
-- Supports multiple sensors per unit for redundancy and accuracy
CREATE TABLE sensor (
    sensor_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL,     -- 'temperature', 'humidity', 'combined'
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    calibration_date DATE,
    last_maintenance DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: reading
-- =====================================================
-- Stores all sensor readings from both MQTT and HTTP sources
-- This is the main data table and will grow large over time
CREATE TABLE reading (
    reading_id BIGSERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    sensor_id INTEGER REFERENCES sensor(sensor_id) ON DELETE SET NULL,
    ts TIMESTAMP NOT NULL,                -- Timestamp of the reading
    temperature DECIMAL(5,2),             -- Temperature in Celsius
    humidity DECIMAL(5,2),                -- Humidity percentage
    source VARCHAR(20) NOT NULL,          -- 'mqtt' or 'http' to track data origin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: threshold
-- =====================================================
-- Defines acceptable ranges for temperature and humidity per storage unit
-- Used for automated alert generation
CREATE TABLE threshold (
    threshold_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    temp_min DECIMAL(5,2) NOT NULL,       -- Minimum safe temperature (°C)
    temp_max DECIMAL(5,2) NOT NULL,       -- Maximum safe temperature (°C)
    humidity_min DECIMAL(5,2) NOT NULL,   -- Minimum safe humidity (%)
    humidity_max DECIMAL(5,2) NOT NULL,   -- Maximum safe humidity (%)
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: alert
-- =====================================================
-- Stores all generated alerts when readings exceed thresholds
CREATE TABLE alert (
    alert_id BIGSERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL,        -- 'warning', 'critical'
    message TEXT NOT NULL,                -- Human-readable alert message
    ts TIMESTAMP NOT NULL,                -- When the alert was triggered
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance Optimization
-- =====================================================

-- Index for querying readings by unit and time range (most common query pattern)
CREATE INDEX idx_reading_unit_ts ON reading(unit_id, ts DESC);

-- Index for time-based queries across all units
CREATE INDEX idx_reading_ts ON reading(ts DESC);

-- Index for finding active alerts by unit
CREATE INDEX idx_alert_unit_resolved ON alert(unit_id, resolved, ts DESC);

-- Index for sensor lookups by unit
CREATE INDEX idx_sensor_unit ON sensor(unit_id);

-- Index for active thresholds
CREATE INDEX idx_threshold_unit_active ON threshold(unit_id, active);

-- =====================================================
-- INITIAL DATA - Storage Units
-- =====================================================

INSERT INTO storage_unit (name, product_type, location) VALUES
('Frozen Foods Unit', 'Frozen Foods', 'Warehouse Section A1'),
('Dairy Products Unit', 'Dairy Products', 'Warehouse Section B2'),
('Fresh Vegetables Unit', 'Fresh Vegetables', 'Warehouse Section C3');

-- =====================================================
-- INITIAL DATA - Sensors
-- =====================================================

-- Unit 1: Frozen Foods - 2 sensors (temperature + humidity)
INSERT INTO sensor (unit_id, sensor_type, manufacturer, model, calibration_date) VALUES
(1, 'temperature', 'SensorTech', 'TH-2000', '2025-01-15'),
(1, 'humidity', 'SensorTech', 'TH-2000', '2025-01-15');

-- Unit 2: Dairy Products - 2 sensors
INSERT INTO sensor (unit_id, sensor_type, manufacturer, model, calibration_date) VALUES
(2, 'temperature', 'SensorTech', 'TH-2000', '2025-01-15'),
(2, 'humidity', 'SensorTech', 'TH-2000', '2025-01-15');

-- Unit 3: Fresh Vegetables - 2 sensors
INSERT INTO sensor (unit_id, sensor_type, manufacturer, model, calibration_date) VALUES
(3, 'temperature', 'SensorTech', 'TH-2000', '2025-01-15'),
(3, 'humidity', 'SensorTech', 'TH-2000', '2025-01-15');

-- =====================================================
-- INITIAL DATA - Thresholds
-- =====================================================

-- Frozen Foods: -20°C to -15°C, 40-60% humidity
INSERT INTO threshold (unit_id, temp_min, temp_max, humidity_min, humidity_max) VALUES
(1, -20.0, -15.0, 40.0, 60.0);

-- Dairy Products: 2°C to 6°C, 50-70% humidity
INSERT INTO threshold (unit_id, temp_min, temp_max, humidity_min, humidity_max) VALUES
(2, 2.0, 6.0, 50.0, 70.0);

-- Fresh Vegetables: 0°C to 4°C, 85-95% humidity
INSERT INTO threshold (unit_id, temp_min, temp_max, humidity_min, humidity_max) VALUES
(3, 0.0, 4.0, 85.0, 95.0);

-- =====================================================
-- SAMPLE DATA - Initial Readings (for testing)
-- =====================================================

-- Add some sample readings so the dashboard has initial data
INSERT INTO reading (unit_id, sensor_id, ts, temperature, humidity, source) VALUES
-- Frozen Foods Unit (last hour)
(1, 1, NOW() - INTERVAL '60 minutes', -18.5, 45.2, 'mqtt'),
(1, 1, NOW() - INTERVAL '50 minutes', -18.2, 46.1, 'mqtt'),
(1, 1, NOW() - INTERVAL '40 minutes', -17.9, 45.8, 'mqtt'),
(1, 1, NOW() - INTERVAL '30 minutes', -18.1, 45.5, 'http'),
(1, 1, NOW() - INTERVAL '20 minutes', -18.3, 46.0, 'mqtt'),
(1, 1, NOW() - INTERVAL '10 minutes', -18.0, 45.7, 'mqtt'),

-- Dairy Products Unit (last hour)
(2, 3, NOW() - INTERVAL '60 minutes', 3.5, 55.2, 'mqtt'),
(2, 3, NOW() - INTERVAL '50 minutes', 3.8, 56.1, 'mqtt'),
(2, 3, NOW() - INTERVAL '40 minutes', 3.6, 55.8, 'mqtt'),
(2, 3, NOW() - INTERVAL '30 minutes', 3.7, 55.5, 'http'),
(2, 3, NOW() - INTERVAL '20 minutes', 3.9, 56.0, 'mqtt'),
(2, 3, NOW() - INTERVAL '10 minutes', 3.5, 55.7, 'mqtt'),

-- Fresh Vegetables Unit (last hour)
(3, 5, NOW() - INTERVAL '60 minutes', 2.1, 88.2, 'mqtt'),
(3, 5, NOW() - INTERVAL '50 minutes', 2.3, 89.1, 'mqtt'),
(3, 5, NOW() - INTERVAL '40 minutes', 2.0, 88.8, 'mqtt'),
(3, 5, NOW() - INTERVAL '30 minutes', 2.2, 88.5, 'http'),
(3, 5, NOW() - INTERVAL '20 minutes', 2.4, 89.0, 'mqtt'),
(3, 5, NOW() - INTERVAL '10 minutes', 2.1, 88.7, 'mqtt');

-- =====================================================
-- DATABASE DESIGN RATIONALE
-- =====================================================
-- 
-- 1. NORMALIZATION:
--    - Separated storage_unit, sensor, and reading tables to avoid redundancy
--    - Allows multiple sensors per unit for redundancy and accuracy
--    - Threshold configuration is separate for easy updates without affecting readings
--
-- 2. SCALABILITY:
--    - BIGSERIAL for reading_id and alert_id (supports billions of records)
--    - Indexed by unit_id and timestamp for fast time-range queries
--    - Ready for partitioning by timestamp if data grows beyond millions of rows
--
-- 3. DATA INTEGRITY:
--    - Foreign key constraints ensure referential integrity
--    - CASCADE deletes prevent orphaned records
--    - NOT NULL constraints on critical fields
--
-- 4. QUERY OPTIMIZATION:
--    - Composite index (unit_id, ts DESC) for dashboard queries
--    - Separate indexes for different query patterns
--    - DESC ordering on timestamp for "latest readings" queries
--
-- 5. AUDIT TRAIL:
--    - created_at timestamps on all tables
--    - source field tracks data origin (mqtt vs http)
--    - resolved_at and resolved_by for alert tracking
--
-- 6. FLEXIBILITY:
--    - active flags allow soft deletes
--    - sensor_id is nullable in reading (allows readings without sensor assignment)
--    - VARCHAR lengths chosen to balance storage and flexibility
--
-- =====================================================

-- Verify the schema
SELECT 'Schema created successfully!' as status;
SELECT 'Storage Units: ' || COUNT(*) FROM storage_unit;
SELECT 'Sensors: ' || COUNT(*) FROM sensor;
SELECT 'Thresholds: ' || COUNT(*) FROM threshold;
SELECT 'Sample Readings: ' || COUNT(*) FROM reading;
