#!/bin/bash

if [ ! -d "scraper_env" ]; then
    echo "[ERROR] Environment not set up. Please run ./setup.sh first."
    exit 1
fi

echo "[1/3] Activating environment..."
source scraper_env/bin/activate

echo "[2/3] Checking Python Sidecar binary..."
# Detect target triple
if [[ "$OSTYPE" == "darwin"* ]]; then
    TRIPLE="aarch64-apple-darwin"
    if [[ $(uname -m) == "x86_64" ]]; then TRIPLE="x86_64-apple-darwin"; fi
else
    TRIPLE="x86_64-unknown-linux-gnu"
fi

BIN_PATH="hexx-scrape/src-tauri/bin/python-engine-$TRIPLE"

if [ ! -f "$BIN_PATH" ]; then
    echo "[INFO] Building Python Sidecar binary for $TRIPLE..."
    pip install pyinstaller
    pyinstaller --onefile --name python-engine --collect-data browser_use src/main.py --distpath dist --workpath build
    mkdir -p hexx-scrape/src-tauri/bin
    mv dist/python-engine "$BIN_PATH"
fi

echo "[3/3] Launching Hexx Scraper..."
cd hexx-scrape
npm run tauri dev
