#!/usr/bin/env python3
"""Smoke-test the exact Python-side imports used by the sidecar before packaging."""

from __future__ import annotations

import importlib
import importlib.metadata
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("BROWSER_USE_SETUP_LOGGING", "false")


def require_python_311() -> None:
    if sys.version_info < (3, 11):
        raise SystemExit(
            f"Hexx Scraper requires Python 3.11+ for browser-use. Found {sys.version.split()[0]}."
        )


def main() -> int:
    require_python_311()

    browser_use = importlib.import_module("browser_use")
    from browser_use import Agent, Browser
    from src import main as sidecar_main
    from src import scraper_logic
    from src.scraper_logic import _get_browser

    browser_config = getattr(browser_use, "BrowserConfig", None)
    browser = _get_browser()

    print(f"python={sys.version.split()[0]}")
    print(f"browser_use={importlib.metadata.version('browser-use')}")
    print(f"agent={Agent.__module__}.{Agent.__name__}")
    print(f"browser={Browser.__module__}.{Browser.__name__}")
    print(f"browser_config={'available' if browser_config else 'unavailable'}")
    print(f"sidecar_main={sidecar_main.__file__}")
    print(f"scraper_logic={scraper_logic.__file__}")
    print(f"browser_instance={browser.__class__.__module__}.{browser.__class__.__name__}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
