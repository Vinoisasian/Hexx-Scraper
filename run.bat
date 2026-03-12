@echo off
setlocal

if not exist scraper_env (
    echo [ERROR] Environment not set up. Please run setup.bat first.
    pause
    exit /b 1
)

echo [1/3] Activating environment...
call scraper_env\Scripts\activate

echo [2/3] Checking Python Sidecar binary...
python scripts\build_sidecar.py
if %errorlevel% neq 0 exit /b %errorlevel%

echo [3/3] Launching Hexx Scraper...
cd hexx-scrape
npm run tauri dev
