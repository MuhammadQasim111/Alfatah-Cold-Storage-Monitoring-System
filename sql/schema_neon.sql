-- =====================================================
-- Smart Cold Storage Monitoring System - Database Schema
-- =====================================================
-- SIMPLIFIED VERSION FOR NEON SQL EDITOR
-- Run this entire script in one go

-- Drop existing tables if they exist
DROP TABLE IF EXISTS alert CASCADE;
DROP TABLE IF EXISTS reading CASCADE;
DROP TABLE IF EXISTS threshold CASCADE;
DROP TABLE IF EXISTS sensor CASCADE;
DROP TABLE IF EXISTS storage_unit CASCADE;

-- Create storage_unit table
CREATE TABLE storage_unit (
    unit_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- Create sensor table
CREATE TABLE sensor (
    sensor_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    calibration_date DATE,
    last_maintenance DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reading table
CREATE TABLE reading (
    reading_id BIGSERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    sensor_id INTEGER REFERENCES sensor(sensor_id) ON DELETE SET NULL,
    ts TIMESTAMP NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    source VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create threshold table
CREATE TABLE threshold (
    threshold_id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    temp_min DECIMAL(5,2) NOT NULL,
    temp_max DECIMAL(5,2) NOT NULL,
    humidity_min DECIMAL(5,2) NOT NULL,
    humidity_max DECIMAL(5,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alert table
CREATE TABLE alert (
    alert_id BIGSERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_unit(unit_id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    ts TIMESTAMP NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_reading_unit_ts ON reading(unit_id, ts DESC);
CREATE INDEX idx_reading_ts ON reading(ts DESC);
CREATE INDEX idx_alert_unit_resolved ON alert(unit_id, resolved, ts DESC);
CREATE INDEX idx_sensor_unit ON sensor(unit_id);
CREATE INDEX idx_threshold_unit_active ON threshold(unit_id, active);

-- Insert storage units
INSERT INTO storage_unit (name, product_type, location) VALUES
('Frozen Foods Unit', 'Frozen Foods', 'Warehouse Section A1'),
('Dairy Products Unit', 'Dairy Products', 'Warehouse Section B2'),
('Fresh Vegetables Unit', 'Fresh Vegetables', 'Warehouse Section C3');

-- Insert sensors
INSERT INTO sensor (unit_id, sensor_type, manufacturer, model, calibration_date) VALUES
(1, 'temperature', 'SensorTech', 'TH-2000', '2025-01-15'),
(1, 'humidity', 'SensorTech', 'TH-2000', '2025-01-15'),
(2, 'temperature', 'SensorTech', 'TH-2000', '2025-01-15'),
(2, 'humidity', 'SensorTech', 'TH-2000', '2025-01-15'),
(3, 'temperature', 'SensorTech', 'TH-2000', '2025-01-15'),
(3, 'humidity', 'SensorTech', 'TH-2000', '2025-01-15');

-- Insert thresholds
INSERT INTO threshold (unit_id, temp_min, temp_max, humidity_min, humidity_max) VALUES
(1, -20.0, -15.0, 40.0, 60.0),
(2, 2.0, 6.0, 50.0, 70.0),
(3, 0.0, 4.0, 85.0, 95.0);

-- Insert sample readings
INSERT INTO reading (unit_id, sensor_id, ts, temperature, humidity, source) VALUES
(1, 1, NOW() - INTERVAL '60 minutes', -18.5, 45.2, 'mqtt'),
(1, 1, NOW() - INTERVAL '50 minutes', -18.2, 46.1, 'mqtt'),
(1, 1, NOW() - INTERVAL '40 minutes', -17.9, 45.8, 'mqtt'),
(1, 1, NOW() - INTERVAL '30 minutes', -18.1, 45.5, 'http'),
(1, 1, NOW() - INTERVAL '20 minutes', -18.3, 46.0, 'mqtt'),
(1, 1, NOW() - INTERVAL '10 minutes', -18.0, 45.7, 'mqtt'),
(2, 3, NOW() - INTERVAL '60 minutes', 3.5, 55.2, 'mqtt'),
(2, 3, NOW() - INTERVAL '50 minutes', 3.8, 56.1, 'mqtt'),
(2, 3, NOW() - INTERVAL '40 minutes', 3.6, 55.8, 'mqtt'),
(2, 3, NOW() - INTERVAL '30 minutes', 3.7, 55.5, 'http'),
(2, 3, NOW() - INTERVAL '20 minutes', 3.9, 56.0, 'mqtt'),
(2, 3, NOW() - INTERVAL '10 minutes', 3.5, 55.7, 'mqtt'),
(3, 5, NOW() - INTERVAL '60 minutes', 2.1, 88.2, 'mqtt'),
(3, 5, NOW() - INTERVAL '50 minutes', 2.3, 89.1, 'mqtt'),
(3, 5, NOW() - INTERVAL '40 minutes', 2.0, 88.8, 'mqtt'),
(3, 5, NOW() - INTERVAL '30 minutes', 2.2, 88.5, 'http'),
(3, 5, NOW() - INTERVAL '20 minutes', 2.4, 89.0, 'mqtt'),
(3, 5, NOW() - INTERVAL '10 minutes', 2.1, 88.7, 'mqtt');
