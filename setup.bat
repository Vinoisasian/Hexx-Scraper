@echo off
setlocal

echo [1/4] Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed. Please install Python 3.10+ and try again.
    pause
    exit /b 1
)

echo [2/4] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo [3/4] Creating Python virtual environment...
if not exist scraper_env (
    python -m venv scraper_env
    call scraper_env\Scripts\activate
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    echo scraper_env already exists, skipping...
)

echo [4/4] Installing Frontend dependencies...
cd hexx-scrape
if not exist node_modules (
    npm install
) else (
    echo node_modules already exists, skipping...
)

echo.
echo ==========================================
echo Setup Complete!
echo You can now run the app using: run.bat
echo ==========================================
pause
