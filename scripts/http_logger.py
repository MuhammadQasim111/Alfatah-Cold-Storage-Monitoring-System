#!/usr/bin/env python3
"""
HTTP Logger for Smart Cold Storage Monitoring System
====================================================
Simulates periodic sensor data logging via HTTP POST requests to the backend API.

API Endpoint: POST /api/readings/log
Post Interval: Every 30 seconds
Units Simulated: 3 (Frozen Foods, Dairy, Fresh Vegetables)

JSON Payload Format:
{
    "unit_id": 1,
    "temperature": 2.3,
    "humidity": 55.7,
    "timestamp": "2025-11-28T21:30:00Z"
}
"""

import requests
import json
import time
import random
import os
from datetime import datetime
import sys

# =====================================================
# CONFIGURATION
# =====================================================

# API Base URL (change for production deployment)
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')
API_ENDPOINT = f"{API_BASE_URL}/api/readings/log"

# Post interval in seconds
POST_INTERVAL = 30

# Request timeout in seconds
REQUEST_TIMEOUT = 10

# =====================================================
# SENSOR SIMULATION DATA
# =====================================================

# Define realistic temperature and humidity ranges for each storage unit
STORAGE_UNITS = {
    1: {
        "name": "Frozen Foods Unit",
        "temp_range": (-20.0, -15.0),  # Frozen foods: -20°C to -15°C
        "humidity_range": (40.0, 60.0),
        "temp_variation": 0.5,
        "humidity_variation": 2.0
    },
    2: {
        "name": "Dairy Products Unit",
        "temp_range": (2.0, 6.0),  # Dairy: 2°C to 6°C
        "humidity_range": (50.0, 70.0),
        "temp_variation": 0.3,
        "humidity_variation": 1.5
    },
    3: {
        "name": "Fresh Vegetables Unit",
        "temp_range": (0.0, 4.0),  # Vegetables: 0°C to 4°C
        "humidity_range": (85.0, 95.0),
        "temp_variation": 0.4,
        "humidity_variation": 1.0
    }
}

# Keep track of last values for smooth transitions
last_values = {
    1: {"temperature": -18.0, "humidity": 50.0},
    2: {"temperature": 4.0, "humidity": 60.0},
    3: {"temperature": 2.0, "humidity": 90.0}
}

# =====================================================
# SENSOR DATA GENERATION
# =====================================================

def generate_sensor_data(unit_id):
    """
    Generate realistic sensor data with smooth transitions
    Occasionally introduces spikes to trigger alerts
    """
    config = STORAGE_UNITS[unit_id]
    last = last_values[unit_id]
    
    # 95% of the time: normal variations within range
    # 5% of the time: introduce a spike (for alert testing)
    if random.random() < 0.95:
        # Normal variation: smooth transition from last value
        temp_change = random.uniform(-config["temp_variation"], config["temp_variation"])
        new_temp = last["temperature"] + temp_change
        
        # Keep within acceptable range
        new_temp = max(config["temp_range"][0], min(config["temp_range"][1], new_temp))
        
        humidity_change = random.uniform(-config["humidity_variation"], config["humidity_variation"])
        new_humidity = last["humidity"] + humidity_change
        new_humidity = max(config["humidity_range"][0], min(config["humidity_range"][1], new_humidity))
    else:
        # Introduce a spike (out of range) to trigger alerts
        if random.random() < 0.5:
            # Temperature spike
            new_temp = config["temp_range"][1] + random.uniform(2, 5)
            new_humidity = last["humidity"]
        else:
            # Humidity spike
            new_temp = last["temperature"]
            new_humidity = config["humidity_range"][1] + random.uniform(5, 10)
    
    # Update last values
    last_values[unit_id]["temperature"] = new_temp
    last_values[unit_id]["humidity"] = new_humidity
    
    return {
        "unit_id": unit_id,
        "temperature": round(new_temp, 2),
        "humidity": round(new_humidity, 2),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# =====================================================
# HTTP POSTING FUNCTIONS
# =====================================================

def post_reading(payload, retry_count=3):
    """
    Post sensor reading to API with retry logic
    """
    for attempt in range(retry_count):
        try:
            response = requests.post(
                API_ENDPOINT,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 200:
                return True, response.json()
            else:
                print(f"  ⚠ HTTP {response.status_code}: {response.text}")
                return False, None
                
        except requests.exceptions.Timeout:
            print(f"  ⚠ Request timeout (attempt {attempt + 1}/{retry_count})")
            if attempt < retry_count - 1:
                time.sleep(2)
        except requests.exceptions.ConnectionError:
            print(f"  ✗ Connection error (attempt {attempt + 1}/{retry_count})")
            if attempt < retry_count - 1:
                time.sleep(2)
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return False, None
    
    return False, None

# =====================================================
# MAIN LOGGING LOOP
# =====================================================

def main():
    """Main function to log sensor data periodically via HTTP"""
    
    print("=" * 60)
    print("HTTP Logger - Smart Cold Storage Monitoring System")
    print("=" * 60)
    print(f"API Endpoint: {API_ENDPOINT}")
    print(f"Post Interval: {POST_INTERVAL} seconds")
    print("-" * 60)
    
    # Test API connectivity
    print("Testing API connectivity...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/storage-units", timeout=5)
        if response.status_code == 200:
            print(f"✓ API is reachable")
            units = response.json()
            print(f"✓ Found {len(units)} storage units in database")
        else:
            print(f"⚠ API returned status {response.status_code}")
    except Exception as e:
        print(f"✗ Cannot reach API: {e}")
        print("\nPlease ensure:")
        print("  1. Next.js dev server is running (npm run dev)")
        print("  2. API_BASE_URL is set correctly")
        print("  3. Database is initialized with schema.sql")
        print("\nContinuing anyway (will retry on each post)...")
    
    print("-" * 60)
    print("Starting HTTP logging...\n")
    
    success_count = 0
    failure_count = 0
    
    try:
        while True:
            for unit_id in STORAGE_UNITS.keys():
                # Generate sensor data
                payload = generate_sensor_data(unit_id)
                
                # Post to API
                print(f"📤 Unit {unit_id} ({STORAGE_UNITS[unit_id]['name']}): "
                      f"{payload['temperature']}°C, {payload['humidity']}%")
                
                success, response_data = post_reading(payload)
                
                if success:
                    print(f"  ✓ Logged successfully")
                    success_count += 1
                else:
                    print(f"  ✗ Failed to log")
                    failure_count += 1
            
            print(f"\nStats: ✓ {success_count} success | ✗ {failure_count} failures")
            print(f"Next update in {POST_INTERVAL} seconds...\n")
            print("-" * 60)
            
            time.sleep(POST_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n⚠ Shutting down HTTP logger...")
        print(f"Final Stats: ✓ {success_count} success | ✗ {failure_count} failures")
        print("✓ Stopped gracefully")
        sys.exit(0)

if __name__ == "__main__":
    main()
