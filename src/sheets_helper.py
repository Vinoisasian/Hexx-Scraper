"""
sheets_helper.py — Google Sheets integration via Apps Script Webhook.

Instead of complex GCP Service Account credentials, this module POSTs 
scraped data to a Google Apps Script Web App (deployed by the user from 
the provided code.gs template).

The webhook URL is stored in settings.json by the Tauri GUI.
"""

import json
import logging
import requests
from typing import Optional

from src.config import load_settings

logger = logging.getLogger(__name__)


def get_urls_from_sheet() -> list[str]:
    """GET the webhook to retrieve URLs from Column A of the sheet."""
    cfg = load_settings()
    webhook = cfg.get("google_webhook_url")
    if not webhook:
        raise ValueError("Google Webhook URL not configured. "
                         "Set it in Settings or GOOGLE_WEBHOOK_URL env var.")

    resp = requests.get(webhook, params={"action": "getUrls"}, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("urls", [])


def push_results_to_sheet(results: list[dict]) -> dict:
    """POST scraped results back to the sheet via the webhook.

    Each item in *results* should look like:
        {"url": "...", "status": "ok", "data": {...}}

    The Apps Script will match URLs in Column A and write the metrics 
    into the adjacent columns.
    """
    cfg = load_settings()
    webhook = cfg.get("google_webhook_url")
    if not webhook:
        raise ValueError("Google Webhook URL not configured.")

    payload = {"action": "writeResults", "results": results}
    resp = requests.post(
        webhook,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()
