"""Run the agent pipeline for a request and collect a decision brief.

The web flow already has the user's watch list (from their profile), so we run an
ANALYSIS pipeline that skips document intake and injects the watch list straight
into session state: sensing → impact → response → comms. Fresh agent instances
are built per process via the factory functions (ADK forbids reusing an agent in
two parents).
"""

from __future__ import annotations

import json
import logging
import time
import uuid

from google.adk.agents import SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from sourcing_sentinel.agents.comms import make_comms_agent
from sourcing_sentinel.agents.impact import make_impact_agent
from sourcing_sentinel.agents.response import make_response_coordinator
from sourcing_sentinel.agents.sensing import make_sensing_team

logger = logging.getLogger(__name__)

APP_NAME = "sourcing_sentinel"

_TRIGGER = (
    "Analyze the supply-chain risk for the watch list already in session state and "
    "draft the supplier emails we should send."
)


def _build_analysis_pipeline() -> SequentialAgent:
    return SequentialAgent(
        name="analysis_pipeline",
        sub_agents=[
            make_sensing_team(),
            make_impact_agent(),
            make_response_coordinator(),
            make_comms_agent(),
        ],
    )


def _parse(value) -> dict | list | None:
    """Parse a state value that may be a JSON string (possibly fenced) or a dict."""
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    text = str(value).strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[len("json"):]
    candidates = [i for i in (text.find("{"), text.find("[")) if i != -1]
    start = min(candidates) if candidates else -1
    end = max(text.rfind("}"), text.rfind("]"))
    if start != -1 and end != -1:
        text = text[start : end + 1]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def run_analysis(watch_list: dict, user_id: str = "api-user") -> dict:
    """Run the analysis pipeline over a watch list and return a Brief dict:
    {"impact": {...}, "response_plan": {...}, "emails": [...], "created_at": ms}.
    """
    session_service = InMemorySessionService()
    session_id = uuid.uuid4().hex
    await session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
        state={"watch_list": json.dumps(watch_list, ensure_ascii=False)},
    )
    runner = Runner(
        agent=_build_analysis_pipeline(),
        app_name=APP_NAME,
        session_service=session_service,
    )
    message = types.Content(role="user", parts=[types.Part(text=_TRIGGER)])
    async for _ in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=message
    ):
        pass

    session = await session_service.get_session(
        app_name=APP_NAME, user_id=user_id, session_id=session_id
    )
    state = session.state if session else {}
    comms = _parse(state.get("comms")) or {}
    return {
        "impact": _parse(state.get("impact")) or {"items": [], "overall_risk": 1, "summary": ""},
        "response_plan": _parse(state.get("response_plan")) or {"priority_actions": [], "chosen": [], "summary": ""},
        "emails": comms.get("emails", []),
        "created_at": int(time.time() * 1000),
    }
