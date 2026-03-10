"""
main.py — Sidecar entry point.

When run directly (or via PyInstaller binary), this script:
  1. Reads a JSON command from stdin
  2. Executes the appropriate action (scrape, test, etc.)
  3. Prints progress and results as JSON lines to stdout

This is how the Tauri GUI communicates with the Python engine.

STANDALONE CLI USAGE:
  echo '{"action": "scrape", "urls": ["https://..."]}' | python -m src.main
  python -m src.main --test   (quick self-test)
"""

import sys
import json
import asyncio
import logging
import os
import platform
from pathlib import Path

# ── Fix PyInstaller Playwright Path Bug ─────────────────────────
# Force Playwright to use the standard global OS cache instead of the PyInstaller temporary folder
if platform.system() == "Darwin":
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(Path.home() / "Library" / "Caches" / "ms-playwright")
elif platform.system() == "Windows":
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(Path.home() / "AppData" / "Local" / "ms-playwright")
else:
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(Path.home() / ".cache" / "ms-playwright")

from src.config import load_settings
from src.scraper_logic import scrape_url, scrape_batch
from src.sheets_helper import get_urls_from_sheet, push_results_to_sheet

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def _emit(event_type: str, payload: dict) -> None:
    """Write a single JSON line to stdout for the Tauri frontend to consume."""
    line = json.dumps({"type": event_type, **payload})
    print(line, flush=True)


async def handle_scrape(urls: list[str]) -> list[dict]:
    """Scrape a list of URLs with concurrency and emit progress."""
    cfg = load_settings()
    max_concurrent = cfg.get("max_concurrent", 5)

    _emit("progress", {"message": f"Starting batch scrape of {len(urls)} URLs...", "total": len(urls), "done": 0})

    results = await scrape_batch(urls, max_concurrent=max_concurrent)

    for i, r in enumerate(results, 1):
        _emit("progress", {
            "message": f"[{i}/{len(urls)}] {r['url']} → {r['status']}",
            "total": len(urls),
            "done": i,
            "result": r,
        })

    _emit("done", {"results": results})
    return results


async def handle_full_pipeline() -> None:
    """Full pipeline: read URLs from Google Sheet → scrape → write back."""
    _emit("progress", {"message": "Fetching URLs from Google Sheet..."})
    urls = get_urls_from_sheet()

    if not urls:
        _emit("done", {"results": [], "message": "No URLs found in sheet."})
        return

    results = await handle_scrape(urls)

    _emit("progress", {"message": "Pushing results to Google Sheet..."})
    resp = push_results_to_sheet(results)
    _emit("done", {"results": results, "sheet_response": resp})


async def main() -> None:
    # Quick self-test mode
    if "--test" in sys.argv:
        test_urls = [
            "https://www.reddit.com/r/commonstack/comments/1rosivm/welcome_to_rcommonstack_your_all_in_one_unified/",
        ]
        results = await handle_scrape(test_urls)
        return

    # Read JSON command from stdin
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            _emit("error", {"message": "No input provided. Send JSON via stdin."})
            return
        cmd = json.loads(raw)
    except json.JSONDecodeError as e:
        _emit("error", {"message": f"Invalid JSON: {e}"})
        return

    action = cmd.get("action", "scrape")

    if action == "scrape":
        urls = cmd.get("urls", [])
        if not urls:
            _emit("error", {"message": "No 'urls' provided in command."})
            return
        await handle_scrape(urls)

    elif action == "pipeline":
        await handle_full_pipeline()

    elif action == "test":
        _emit("done", {"message": "Engine is alive!", "settings": load_settings()})

    else:
        _emit("error", {"message": f"Unknown action: {action}"})


if __name__ == "__main__":
    asyncio.run(main())
