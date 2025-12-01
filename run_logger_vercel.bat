@echo off
echo Starting HTTP Logger for Vercel Deployment...
echo.

:: Set the Vercel URL
set API_BASE_URL=https://alfatah-cold-storage-monitoring-sys-phi.vercel.app

:: Run the logger
py scripts/http_logger.py

pause
