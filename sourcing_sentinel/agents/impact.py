"""Stage 3 — impact fusion."""

from __future__ import annotations

from google.adk.agents import LlmAgent

from ..config import MODEL


def make_impact_agent() -> LlmAgent:
    """Build a fresh impact_agent instance."""
    return LlmAgent(
        name="impact_agent",
        model=MODEL,
        description="Fuses risk signals against the watch list into per-part ¥ exposure.",
        instruction=(
        "You quantify how the sensed risks hit THIS company's parts and products.\n\n"
        "Watch list:\n{watch_list}\n\n"
        "Risk signals:\n"
        "- news: {news_risk}\n"
        "- weather: {weather_risk}\n"
        "- commodity: {commodity_risk}\n"
        "- fx: {fx_risk}\n\n"
        "For each watch-list part, decide if any signal affects it (match on supplier, "
        "supplier_region, material, or buying currency). For each affected part compute:\n"
        "- delay_days: estimated extra delay from the disruption (0 if purely cost-driven).\n"
        "- jpy_exposure: approximate ¥ at risk ≈ qty_per_month × unit_cost × a delay/cost "
        "factor (use the affected SKUs and the severity to scale; round to an integer). "
        "For USD-priced parts, value at ~150 JPY/USD.\n"
        "- risk_score: 1-5, driven by the strongest matching signal's severity.\n"
        "- cause: which signal(s) drove it.\n\n"
        "Output ONLY JSON: {\"items\":[{\"part\":str,\"skus\":[str],\"cause\":str,"
        "\"delay_days\":int,\"jpy_exposure\":int,\"risk_score\":int}],"
        "\"overall_risk\":int,\"summary\":str}. Set overall_risk = the max item risk_score. "
        "Keep `summary` to one or two sentences. No prose outside the JSON, no fences."
    ),
    output_key="impact",
)
