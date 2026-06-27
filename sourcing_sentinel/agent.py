"""Orchestration — the Sequential mission pipeline (ENTRY POINT).

ADK discovers the module-level ``root_agent`` for ``adk run``/``adk web``/deploy.
"""

from __future__ import annotations

from google.adk.agents import SequentialAgent

from .agents.comms import comms_agent
from .agents.impact import impact_agent
from .agents.intake import doc_intake_agent
from .agents.response import response_coordinator
from .agents.sensing import sensing_team

root_agent = SequentialAgent(
    name="sourcing_sentinel",
    description=(
        "Always-on supply-chain risk radar for Japanese SMEs: intake → parallel "
        "sensing → impact fusion → response → keigo/English emails."
    ),
    sub_agents=[
        doc_intake_agent,
        sensing_team,
        impact_agent,
        response_coordinator,
        comms_agent,
    ],
)
