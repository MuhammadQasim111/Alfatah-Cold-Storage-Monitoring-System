@echo off
echo ===================================================
echo STOPPING OLD SCRIPTS...
echo ===================================================
:: Kill all running Python processes to ensure old loggers are stopped
taskkill /F /IM python.exe /T
echo.

echo ===================================================
echo STARTING NEW SYSTEM...
echo ===================================================

:: 1. Start MQTT Publisher (Sends live data to HiveMQ)
echo Starting MQTT Publisher...
start "MQTT Publisher" cmd /k "py scripts/mqtt_publisher.py"

:: 2. Start HTTP Logger (Sends history to Vercel)
echo Starting HTTP Logger...
set API_BASE_URL=https://alfatah-cold-storage-monitoring-sys-phi.vercel.app
start "HTTP Logger (Vercel)" cmd /k "py scripts/http_logger.py"

echo.
echo ===================================================
echo DONE! 
echo 1. Check the two new windows that opened.
echo 2. You should see "200 OK" in the Logger window.
echo 3. You should see "Published" in the Publisher window.
echo ===================================================
pause
