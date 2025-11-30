@echo off
echo ========================================
echo  Smart Cold Storage - MQTT Publisher
echo ========================================
echo.
echo Setting environment variables...
set HIVEMQ_HOST=2faf87f825a94c9f9f4a0db4f9569ab6.s1.eu.hivemq.cloud
set HIVEMQ_USER=hivemq.webclient.1764417700877
set HIVEMQ_PASS=Tm1,0S5oP.4x^<YE#hkGy

echo.
echo Starting MQTT Publisher...
echo This will publish sensor data every 5 seconds
echo Press Ctrl+C to stop
echo.
python scripts/mqtt_publisher.py
pause
