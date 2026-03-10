"""
config.py — Centralised configuration loader.

Reads from environment variables (via .env) or from a JSON settings
file that the Tauri GUI will write to disk.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Paths ────────────────────────────────────────────────────────
SETTINGS_DIR = Path.home() / ".config" / "scraper-gui"
# Allow override from Tauri backend
SETTINGS_FILE = Path(os.environ.get("SETTINGS_PATH", SETTINGS_DIR / "settings.json"))

# ── Defaults ─────────────────────────────────────────────────────
DEFAULT_SETTINGS = {
    "commonstack_api_key": "",
    "commonstack_base_url": "https://api.commonstack.ai/v1",
    "commonstack_model": "openai/gpt-oss-120b",
    "google_webhook_url": "",       # Apps Script Web-App URL
    "sheet_id": "",
    "max_concurrent": 5,
    "headless": True,
}


def load_settings() -> dict:
    """Return merged settings: file ← env overrides."""
    settings = dict(DEFAULT_SETTINGS)

    # 1) Read saved JSON (written by the Tauri GUI)
    if SETTINGS_FILE.is_file():
        with open(SETTINGS_FILE, "r") as f:
            saved = json.load(f)
            settings.update({k: v for k, v in saved.items() if v})

    # 2) Env-var overrides (highest priority)
    env_map = {
        "COMMONSTACK_API_KEY": "commonstack_api_key",
        "COMMONSTACK_BASE_URL": "commonstack_base_url",
        "COMMONSTACK_MODEL": "commonstack_model",
        "GOOGLE_WEBHOOK_URL": "google_webhook_url",
        "SHEET_ID": "sheet_id",
    }
    for env_key, setting_key in env_map.items():
        val = os.environ.get(env_key)
        if val:
            settings[setting_key] = val

    return settings


def save_settings(settings: dict) -> None:
    """Persist settings to the JSON file (called by Tauri)."""
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)
