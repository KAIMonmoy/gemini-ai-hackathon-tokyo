"""End-to-end pipeline runner (real Gemini on Vertex).

Runs the full Sourcing Sentinel mission pipeline against ``gemini-3.5-flash`` with
the data tools stubbed (``USE_STUBS=true``) so external data is deterministic while
the agent reasoning is real. Verifies the SPEC §14 chain:

    watch_list -> 4 risk streams -> impact -> response_plan -> JP+EN emails

Requires Application Default Credentials (run ``gcloud auth application-default
login`` first) and network access. Run with:

    .venv/bin/python -m sourcing_sentinel.tests.test_pipeline
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from ..agent import root_agent

APP_NAME = "sourcing_sentinel"
USER_ID = "demo-user"
SESSION_ID = "demo-session"

PROMPT = (
    "Our company just uploaded its bill of materials and recent supplier invoices. "
    "Please assess our current supply-chain risk and draft the supplier emails we "
    "should send."
)


def _parse(value) -> dict | list | None:
    """Parse a state value that may be a JSON string (possibly fenced) or already a dict."""
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    text = str(value).strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[len("json"):]
    start = min((i for i in (text.find("{"), text.find("[")) if i != -1), default=-1)
    end = max(text.rfind("}"), text.rfind("]"))
    if start != -1 and end != -1:
        text = text[start : end + 1]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def run_pipeline() -> dict:
    session_service = InMemorySessionService()
    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)
    message = types.Content(role="user", parts=[types.Part(text=PROMPT)])

    print("\n=== Running pipeline (real Gemini) ===")
    async for event in runner.run_async(
        user_id=USER_ID, session_id=SESSION_ID, new_message=message
    ):
        author = getattr(event, "author", None)
        if author and event.content and event.content.parts:
            snippet = "".join(p.text or "" for p in event.content.parts).strip()
            if snippet:
                print(f"  [{author}] {snippet[:120].replace(chr(10), ' ')}...")

    session = await session_service.get_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    return dict(session.state)


def assert_pipeline(state: dict) -> list[str]:
    """Return a list of failure messages (empty == all checks passed)."""
    failures: list[str] = []

    watch_list = _parse(state.get("watch_list"))
    if not (watch_list and len(watch_list.get("items", [])) >= 3):
        failures.append("watch_list missing or has < 3 items")

    for key in ("news_risk", "weather_risk", "commodity_risk", "fx_risk"):
        risk = _parse(state.get(key))
        if risk is None or "signals" not in risk:
            failures.append(f"{key} missing or has no 'signals' array")

    impact = _parse(state.get("impact"))
    if not (impact and impact.get("items")):
        failures.append("impact missing or has no items")
    elif not any("titanium" in (it.get("part", "").lower()) for it in impact["items"]):
        failures.append("impact does not flag the titanium bolt (expected from demo trigger)")

    response_plan = _parse(state.get("response_plan"))
    if not (response_plan and response_plan.get("chosen")):
        failures.append("response_plan missing or has empty 'chosen'")

    comms = _parse(state.get("comms"))
    emails = (comms or {}).get("emails", []) if comms else []
    langs = {e.get("lang", "").upper() for e in emails}
    if "JP" not in langs:
        failures.append("no JP (keigo) email produced")
    if "EN" not in langs:
        failures.append("no EN email produced")

    return failures


def _print_brief(state: dict) -> None:
    impact = _parse(state.get("impact")) or {}
    response_plan = _parse(state.get("response_plan")) or {}
    comms = _parse(state.get("comms")) or {}
    print("\n=== Decision brief ===")
    print("Impact summary:", impact.get("summary"))
    print("Overall risk:", impact.get("overall_risk"))
    print("Chosen response:", response_plan.get("chosen"))
    for email in comms.get("emails", []):
        print(f"  - [{email.get('lang')}] to {email.get('to')}: {email.get('subject')}")


async def _main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    try:
        state = await run_pipeline()
    except Exception as exc:  # surface ADC/auth issues clearly
        print(f"\nERROR running pipeline: {exc!r}")
        print(
            "If this is an auth error, run: gcloud auth application-default login\n"
            "and ensure .env has GOOGLE_GENAI_USE_VERTEXAI=TRUE + project/location."
        )
        return 2

    _print_brief(state)
    failures = assert_pipeline(state)
    if failures:
        print("\n=== FAIL ===")
        for f in failures:
            print("  -", f)
        return 1
    print("\n=== PASS: full pipeline chain verified ===")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
