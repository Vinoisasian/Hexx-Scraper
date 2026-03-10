#!/bin/bash

echo "[1/4] Checking for Python..."
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed."
    exit 1
fi

echo "[2/4] Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    exit 1
fi

echo "[3/4] Creating Python virtual environment..."
if [ ! -d "scraper_env" ]; then
    python3 -m venv scraper_env
    source scraper_env/bin/activate
    python3 -m pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "scraper_env already exists, skipping..."
fi

echo "[4/4] Installing Frontend dependencies..."
cd hexx-scrape
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "node_modules already exists, skipping..."
fi

echo -e "\n=========================================="
echo "Setup Complete!"
echo "You can now run the app using: ./run.sh"
echo "=========================================="
