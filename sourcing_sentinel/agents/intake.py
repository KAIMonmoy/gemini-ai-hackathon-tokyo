"""Stage 1 — multimodal document intake."""

from __future__ import annotations

from google.adk.agents import LlmAgent

from ..config import MODEL
from ..tools import parse_documents


def make_doc_intake_agent() -> LlmAgent:
    """Build a fresh doc_intake_agent (new instance per call so it can be used in
    independent pipelines without ADK parent-conflict)."""
    return LlmAgent(
        name="doc_intake_agent",
        model=MODEL,
        description="Reads uploaded BOM/invoice files into a structured watch list.",
        instruction=(
            "You build the company's supply watch list from its uploaded documents.\n"
            "1. Call the `parse_documents` tool. Pass any file paths mentioned in the "
            "user's message as `file_paths`; if none are given, call it with an empty list.\n"
            "2. The tool returns JSON with keys `currency_home` and `items` (each item has "
            "part, supplier, supplier_region, country, currency, qty_per_month, unit_cost, "
            "lead_time_days, skus, material).\n"
            "3. Output that JSON object EXACTLY as returned — no commentary, no markdown "
            "fences. Do not invent or drop items."
        ),
        tools=[parse_documents],
        output_key="watch_list",
    )
