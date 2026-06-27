"""FastAPI app: agent API + serves the built SPA as one Cloud Run service.

Routes:
  GET  /api/healthz       liveness
  POST /api/analyze       (auth) load watch list -> run pipeline -> save + return brief
  POST /api/upload-bom    (auth) multimodal BOM intake -> watch list
  GET  /{path}            SPA static files with index.html fallback (client routing)
"""

from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import sourcing_sentinel.config  # noqa: F401  (load .env)
from sourcing_sentinel.tools import parse_documents

from .auth import current_uid
from .runner import run_analysis
from .store import load_watch_list, save_run

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Sourcing Sentinel API")

_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/healthz")
async def healthz() -> dict:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(uid: str = Depends(current_uid)) -> dict:
    """Run the risk pipeline over the caller's saved watch list, persist, and return the brief."""
    watch_list = load_watch_list(uid)
    if not watch_list.get("items"):
        raise HTTPException(status_code=400, detail="No watch-list items in your profile yet.")
    brief = await run_analysis(watch_list, user_id=uid)
    try:
        save_run(uid, brief)
    except Exception:  # don't fail the response if persistence hiccups
        logger.exception("Failed to persist run for uid=%s", uid)
    return brief


@app.post("/api/upload-bom")
async def upload_bom(files: list[UploadFile], uid: str = Depends(current_uid)) -> dict:
    """Extract a watch list from uploaded BOM/invoice files (multimodal in live mode)."""
    paths: list[str] = []
    with tempfile.TemporaryDirectory() as tmp:
        for f in files:
            dest = Path(tmp) / (f.filename or "upload.bin")
            dest.write_bytes(await f.read())
            paths.append(str(dest))
        watch_list = parse_documents(paths)
    return {"watch_list": watch_list}


# --- Static SPA (mounted last so /api/* takes precedence) ---------------------

def _resolve_static_dir() -> Path | None:
    env_dir = os.getenv("STATIC_DIR")
    candidates = [Path(env_dir)] if env_dir else []
    candidates.append(Path(__file__).resolve().parent / "static")  # Docker copies here
    candidates.append(Path(__file__).resolve().parent.parent / "frontend" / "dist")
    for c in candidates:
        if c.is_dir() and (c / "index.html").exists():
            return c
    return None


_STATIC_DIR = _resolve_static_dir()
if _STATIC_DIR:
    logger.info("Serving SPA from %s", _STATIC_DIR)

    @app.get("/{full_path:path}")
    async def spa(full_path: str) -> FileResponse:
        # Serve a real file if it exists, else fall back to index.html (client routing).
        candidate = (_STATIC_DIR / full_path).resolve()
        if full_path and candidate.is_file() and _STATIC_DIR in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(_STATIC_DIR / "index.html")
else:
    logger.warning("No built SPA found; running API-only (use Vite dev server for the UI).")
