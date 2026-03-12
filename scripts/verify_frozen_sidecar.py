#!/usr/bin/env python3
"""Verify that the frozen PyInstaller sidecar contains the browser_use modules it needs."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()

    archive = args.archive.resolve()
    if not archive.is_file():
        raise SystemExit(f"Frozen sidecar not found: {archive}")

    viewer = shutil.which("pyi-archive_viewer")
    if viewer is None:
        raise SystemExit("pyi-archive_viewer is not available in the active environment.")

    result = subprocess.run(
        [viewer, "-r", "-b", str(archive)],
        check=True,
        capture_output=True,
        text=True,
    )
    listing = result.stdout

    required_entries = [
        "main",
        "src.scraper_logic",
        "browser_use",
        "browser_use.agent.service",
        "browser_use.browser",
        "browser_use.browser.browser",
        "browser_use.browser.context",
        "browser_use.telemetry.service",
    ]
    missing = [entry for entry in required_entries if entry not in listing]
    if missing:
        raise SystemExit(
            "Frozen sidecar is missing required modules:\n" + "\n".join(f"- {entry}" for entry in missing)
        )

    print(f"verified_archive={archive}")
    for entry in required_entries:
        print(f"verified_entry={entry}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
