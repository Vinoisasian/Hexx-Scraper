#!/usr/bin/env python3
"""Build the Python sidecar, then verify the frozen archive contents."""

from __future__ import annotations

import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT / "dist"
BUILD_DIR = ROOT / "build"
BIN_DIR = ROOT / "hexx-scrape" / "src-tauri" / "bin"
PYINSTALLER_CONFIG_DIR = ROOT / ".pyinstaller"


def target_name() -> str:
    system = platform.system()
    machine = platform.machine().lower()

    if system == "Windows":
        return "python-engine-x86_64-pc-windows-msvc.exe"
    if system == "Darwin":
        if machine in {"arm64", "aarch64"}:
            return "python-engine-aarch64-apple-darwin"
        return "python-engine-x86_64-apple-darwin"
    return "python-engine-x86_64-unknown-linux-gnu"


def built_artifact_name() -> str:
    return "python-engine.exe" if platform.system() == "Windows" else "python-engine"


def run(cmd: list[str]) -> None:
    env = os.environ.copy()
    env.setdefault("PYINSTALLER_CONFIG_DIR", str(PYINSTALLER_CONFIG_DIR))
    subprocess.run(cmd, cwd=ROOT, check=True, env=env)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--if-missing",
        action="store_true",
        help="Skip the build when the sidecar binary already exists in src-tauri/bin.",
    )
    args = parser.parse_args()

    target = BIN_DIR / target_name()
    if args.if_missing and target.is_file():
        print(f"sidecar_present={target}")
        return 0

    BIN_DIR.mkdir(parents=True, exist_ok=True)
    PYINSTALLER_CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    run([sys.executable, "scripts/check_sidecar_imports.py"])
    run(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--noconfirm",
            "python-engine.spec",
            "--distpath",
            str(DIST_DIR),
            "--workpath",
            str(BUILD_DIR),
        ]
    )

    artifact = DIST_DIR / built_artifact_name()
    run([sys.executable, "scripts/verify_frozen_sidecar.py", str(artifact)])

    if target.exists():
        target.unlink()
    shutil.move(str(artifact), str(target))

    print(f"sidecar_target={target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
