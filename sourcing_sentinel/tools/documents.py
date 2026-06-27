"""Multimodal BOM/invoice intake."""

from __future__ import annotations

import json
import logging
import mimetypes
from pathlib import Path

from ..config import DATA_DIR, MODEL

logger = logging.getLogger(__name__)

_SCHEMA_HINT = (
    '{"currency_home":"JPY","items":[{"part":str,"supplier":str,'
    '"supplier_region":str,"country":str,"currency":str,'
    '"qty_per_month":int,"unit_cost":float,"lead_time_days":int,'
    '"skus":[str],"material":str}]}'
)

_PROMPT = (
    "You are reading a manufacturer's bill of materials and/or supplier invoices.\n"
    "Extract EVERY distinct part as a line item and return JSON matching this schema:\n"
    f"{_SCHEMA_HINT}\n"
    "Rules:\n"
    "- One object per part. Use values actually shown in the document.\n"
    "- currency: the buying currency for that part (e.g. JPY, USD). currency_home = the "
    "company's home currency (JPY unless clearly otherwise).\n"
    "- qty_per_month int, unit_cost number, lead_time_days int. If a field is missing, use a "
    "sensible default (0 for unknown numbers, [] for skus, '' for unknown text) — never invent "
    "suppliers or parts that are not in the document.\n"
    "- skus = the finished products each part feeds, if shown.\n"
    "Return ONLY the JSON object."
)


def parse_documents(file_paths: list[str]) -> dict:
    """Extract a structured watch_list from BOM/invoice files (PDF, image, or xlsx).

    Uses Gemini multimodal to read each uploaded file. NOTE: document parsing is NOT
    gated by USE_STUBS — USE_STUBS controls the demo risk *signals*, not the user's real
    document. When no files are given (offline test / seed flow), returns the sample BOM.

    Args:
        file_paths: local paths to uploaded BOM/invoice files.

    Returns:
        {"items": [WatchListItem, ...], "currency_home": "JPY"}
    """
    if not file_paths:
        logger.info("parse_documents: no files -> returning data/sample_bom.json (seed)")
        return json.loads((DATA_DIR / "sample_bom.json").read_text())

    # --- Gemini multimodal extraction (inline bytes; works on Vertex AND AI Studio) ---
    try:
        from google import genai
        from google.genai import types

        client = genai.Client()
        parts: list = [types.Part.from_text(text=_PROMPT)]
        for path in file_paths:
            data = Path(path).read_bytes()
            parts.append(types.Part.from_bytes(data=data, mime_type=_guess_mime(path)))

        resp = client.models.generate_content(
            model=MODEL,
            contents=[types.Content(role="user", parts=parts)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0,
            ),
        )
        result = _strip_json(resp.text)
        if not result.get("items"):
            logger.warning("parse_documents: model returned no items")
        else:
            logger.info("parse_documents: extracted %d item(s)", len(result["items"]))
        result.setdefault("currency_home", "JPY")
        return result
    except Exception:  # never crash intake on a flaky upload/parse
        logger.exception("parse_documents: live extraction failed; returning empty watch_list")
        return {"items": [], "currency_home": "JPY"}


def _guess_mime(path: str) -> str:
    mime, _ = mimetypes.guess_type(path)
    if mime:
        return mime
    ext = path.lower().rsplit(".", 1)[-1] if "." in path else ""
    return {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "heic": "image/heic",
    }.get(ext, "application/octet-stream")


def _strip_json(text: str) -> dict:
    """Tolerate ```json fences and leading/trailing prose around a JSON object."""
    t = (text or "").strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1]
        if t.startswith("json"):
            t = t[len("json"):]
    start, end = t.find("{"), t.rfind("}")
    if start != -1 and end != -1:
        t = t[start : end + 1]
    return json.loads(t)
