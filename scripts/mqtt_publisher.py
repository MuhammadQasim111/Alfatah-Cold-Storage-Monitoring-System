#!/usr/bin/env python3
"""
MQTT Publisher for Smart Cold Storage Monitoring System
========================================================
Simulates real-time sensor data and publishes to HiveMQ Cloud via MQTT.

Topic Structure: coldstorage/{unit_id}/readings
Publish Interval: Every 5 seconds
Units Simulated: 3 (Frozen Foods, Dairy, Fresh Vegetables)

JSON Payload Format:
{
    "unit_id": 1,
    "temperature": 2.3,
    "humidity": 55.7,
    "timestamp": "2025-11-28T21:30:00Z"
}
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import os
from datetime import datetime
import sys

# =====================================================
# CONFIGURATION
# =====================================================

# MQTT Broker Configuration (HiveMQ Cloud)
MQTT_BROKER = os.getenv('HIVEMQ_HOST', '2faf87fb25a94c94af4d9f4569ab6381.s1.eu.hivemq.cloud')
MQTT_PORT = 8883  # TLS port
MQTT_USERNAME = os.getenv('HIVEMQ_USER', 'your_username')
MQTT_PASSWORD = os.getenv('HIVEMQ_PASS', 'your_password')

# Topic naming convention
TOPIC_TEMPLATE = "coldstorage/{unit_id}/readings"

# Publish interval in seconds
PUBLISH_INTERVAL = 5

# =====================================================
# SENSOR SIMULATION DATA
# =====================================================

# Define realistic temperature and humidity ranges for each storage unit
STORAGE_UNITS = {
    1: {
        "name": "Frozen Foods Unit",
        "temp_range": (-20.0, -15.0),  # Frozen foods: -20°C to -15°C
        "humidity_range": (40.0, 60.0),
        "temp_variation": 0.5,  # Random variation
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

# =====================================================
# MQTT CALLBACKS
# =====================================================

def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print(f"✓ Connected to HiveMQ Cloud at {MQTT_BROKER}")
        print(f"✓ Publishing to topics: coldstorage/[1-3]/readings")
        print(f"✓ Interval: {PUBLISH_INTERVAL} seconds")
        print("-" * 60)
    else:
        print(f"✗ Connection failed with code {rc}")
        sys.exit(1)

def on_publish(client, userdata, mid):
    """Callback when message is published"""
    pass  # Silent to avoid spam

def on_disconnect(client, userdata, rc):
    """Callback when disconnected from broker"""
    if rc != 0:
        print(f"\n⚠ Unexpected disconnection. Reconnecting...")

# =====================================================
# SENSOR DATA GENERATION
# =====================================================

# Keep track of last values for smooth transitions
last_values = {
    1: {"temperature": -18.0, "humidity": 50.0},
    2: {"temperature": 4.0, "humidity": 60.0},
    3: {"temperature": 2.0, "humidity": 90.0}
}

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
# MAIN PUBLISHING LOOP
# =====================================================

def main():
    """Main function to publish sensor data continuously"""
    
    print("=" * 60)
    print("MQTT Publisher - Smart Cold Storage Monitoring System")
    print("=" * 60)
    
    # Create MQTT client
    client = mqtt.Client(client_id=f"mqtt_publisher_{random.randint(1000, 9999)}")
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.tls_set()  # Enable TLS
    
    # Set callbacks
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.on_disconnect = on_disconnect
    
    # Connect to broker
    try:
        print(f"Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    except Exception as e:
        print(f"✗ Connection error: {e}")
        print("\nPlease check:")
        print("  1. HIVEMQ_HOST environment variable is set correctly")
        print("  2. HIVEMQ_USER and HIVEMQ_PASS are correct")
        print("  3. Internet connection is active")
        sys.exit(1)
    
    # Start network loop in background
    client.loop_start()
    
    # Wait for connection
    time.sleep(2)
    
    try:
        # Main publishing loop
        while True:
            for unit_id in STORAGE_UNITS.keys():
                # Generate sensor data
                payload = generate_sensor_data(unit_id)
                
                # Publish to MQTT topic
                topic = TOPIC_TEMPLATE.format(unit_id=unit_id)
                result = client.publish(topic, json.dumps(payload), qos=1)
                
                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    print(f"📤 Unit {unit_id} ({STORAGE_UNITS[unit_id]['name']}): "
                          f"{payload['temperature']}°C, {payload['humidity']}% → {topic}")
                else:
                    print(f"✗ Failed to publish to {topic}")
            
            print()  # Blank line for readability
            time.sleep(PUBLISH_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n\n⚠ Shutting down MQTT publisher...")
        client.loop_stop()
        client.disconnect()
        print("✓ Disconnected gracefully")
        sys.exit(0)

if __name__ == "__main__":
    main()
