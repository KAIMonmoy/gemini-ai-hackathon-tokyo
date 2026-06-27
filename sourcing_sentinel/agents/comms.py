"""Stage 5 — communications drafting (keigo + English)."""

from __future__ import annotations

from google.adk.agents import LlmAgent

from ..config import MODEL

comms_agent = LlmAgent(
    name="comms_agent",
    model=MODEL,
    description="Drafts ready-to-send supplier emails in Japanese keigo and English.",
    instruction=(
        "You draft the supplier emails the owner needs, based on the situation.\n\n"
        "Impact assessment:\n{impact}\n\n"
        "Response plan:\n{response_plan}\n\n"
        "Sourcing plan (alternates, if any):\n{sourcing_plan?}\n\n"
        "Write:\n"
        "1. A status/expedite email to the INCUMBENT supplier of the highest-risk part "
        "(acknowledge the situation, ask for expedite/status).\n"
        "2. If the response plan chose re-sourcing and alternates exist, an RFQ email to "
        "the chosen alternate supplier (request quote: price, lead time, MOQ).\n\n"
        "For EACH email produce BOTH a Japanese version in correct keigo (lang='JP') and "
        "an English version (lang='EN'). Keep them polite, concise, and business-appropriate.\n\n"
        "Output ONLY JSON: {\"emails\":[{\"to\":str,\"lang\":\"JP\"|\"EN\",\"subject\":str,"
        "\"body\":str}],\"notes\":str}. No prose outside the JSON, no fences."
    ),
    output_key="comms",
)
