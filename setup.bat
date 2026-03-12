@echo off
setlocal

echo [1/4] Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed. Please install Python 3.11+ and try again.
    pause
    exit /b 1
)
python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)"
if %errorlevel% neq 0 (
    echo Error: Hexx Scraper requires Python 3.11+.
    pause
    exit /b 1
)

echo [2/4] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 20+ and try again.
    pause
    exit /b 1
)

echo [3/4] Creating Python virtual environment...
if not exist scraper_env (
    python -m venv scraper_env
) else (
    echo scraper_env already exists, reusing...
)
call scraper_env\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt -c constraints.txt
python -m playwright install chromium

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
