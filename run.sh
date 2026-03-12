#!/bin/bash

if [ ! -d "scraper_env" ]; then
    echo "[ERROR] Environment not set up. Please run ./setup.sh first."
    exit 1
fi

echo "[1/3] Activating environment..."
source scraper_env/bin/activate

echo "[2/3] Checking Python Sidecar binary..."
python scripts/build_sidecar.py

echo "[3/3] Launching Hexx Scraper..."
cd hexx-scrape
npm run tauri dev
