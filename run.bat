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
:: Ensure the binary exists for the current platform
set BIN_PATH=hexx-scrape\src-tauri\bin\python-engine-x86_64-pc-windows-msvc.exe
if not exist %BIN_PATH% (
    echo [INFO] Building Python Sidecar binary...
    pip install pyinstaller
    pyinstaller --onefile --name python-engine --collect-data browser_use src/main.py --distpath dist --workpath build
    mkdir hexx-scrape\src-tauri\bin
    move dist\python-engine.exe %BIN_PATH%
)

echo [3/3] Launching Hexx Scraper...
cd hexx-scrape
npm run tauri dev
