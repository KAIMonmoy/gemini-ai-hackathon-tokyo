"""Orchestration — the Sequential mission pipeline (ENTRY POINT).

ADK discovers the module-level ``root_agent`` for ``adk run``/``adk web``/deploy.
"""

from __future__ import annotations

from google.adk.agents import SequentialAgent

from .agents.comms import make_comms_agent
from .agents.impact import make_impact_agent
from .agents.intake import make_doc_intake_agent
from .agents.response import make_response_coordinator
from .agents.sensing import make_sensing_team

root_agent = SequentialAgent(
    name="sourcing_sentinel",
    description=(
        "Always-on supply-chain risk radar for Japanese SMEs: intake → parallel "
        "sensing → impact fusion → response → keigo/English emails."
    ),
    sub_agents=[
        make_doc_intake_agent(),
        make_sensing_team(),
        make_impact_agent(),
        make_response_coordinator(),
        make_comms_agent(),
    ],
)
