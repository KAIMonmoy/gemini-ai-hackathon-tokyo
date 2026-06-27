"""Multimodal BOM/invoice intake."""

from __future__ import annotations

import json
import logging

from ..config import DATA_DIR, MODEL, USE_STUBS

logger = logging.getLogger(__name__)


def parse_documents(file_paths: list[str]) -> dict:
    """Extract a structured watch_list from BOM/invoice files (PDF, image, or xlsx).

    Uses Gemini multimodal to read each file and return JSON matching the WatchList
    shape: parts, suppliers, regions, buying currency, quantities, unit cost, lead
    time, the finished SKUs each part feeds, and the raw material.

    Args:
        file_paths: local paths to uploaded BOM/invoice files.

    Returns:
        {"items": [WatchListItem, ...], "currency_home": "JPY"}
    """
    if USE_STUBS:
        logger.info("parse_documents: USE_STUBS -> returning data/sample_bom.json")
        return json.loads((DATA_DIR / "sample_bom.json").read_text())

    # --- Real path (Phase 3): Gemini multimodal extraction ---------------------
    try:
        from google import genai
        from google.genai import types

        client = genai.Client()
        schema_hint = (
            '{"currency_home":"JPY","items":[{"part":str,"supplier":str,'
            '"supplier_region":str,"country":str,"currency":str,'
            '"qty_per_month":int,"unit_cost":float,"lead_time_days":int,'
            '"skus":[str],"material":str}]}'
        )
        parts: list[types.Part] = [
            types.Part.from_text(
                text=(
                    "Extract the bill of materials as JSON with this schema "
                    f"{schema_hint}. Infer currency_home as JPY if unclear. "
                    "Return ONLY JSON, no prose, no markdown fences."
                )
            )
        ]
        for path in file_paths:
            uploaded = client.files.upload(file=path)
            parts.append(
                types.Part.from_uri(file_uri=uploaded.uri, mime_type=uploaded.mime_type)
            )

        resp = client.models.generate_content(
            model=MODEL, contents=[types.Content(role="user", parts=parts)]
        )
        return _strip_json(resp.text)
    except Exception:  # never crash intake on a flaky upload/parse
        logger.exception("parse_documents: live extraction failed; returning empty watch_list")
        return {"items": [], "currency_home": "JPY"}


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
