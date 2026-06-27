"""Central configuration: model id, stub flag, and shared paths.

Loads ``.env`` once at import time so every module sees the same settings.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# The only model used anywhere in this project (no fallback).
MODEL: str = os.getenv("MODEL", "gemini-3.5-flash")

# When true, tools return deterministic canned data and make no network calls.
USE_STUBS: bool = os.getenv("USE_STUBS", "true").lower() == "true"

# Repo-level data directory holding seed BOM + scripted demo trigger.
DATA_DIR: Path = Path(__file__).resolve().parent.parent / "data"
