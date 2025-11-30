@echo off
echo ========================================
echo  Smart Cold Storage - HTTP Logger
echo ========================================
echo.
echo Starting HTTP Logger...
echo This will post sensor data every 30 seconds
echo Press Ctrl+C to stop
echo.
python scripts/http_logger.py
pause
