"""Stage 4 — response coordination (Coordinator + Loop-Review + Agent-as-Tool)."""

from __future__ import annotations

from google.adk.agents import LlmAgent, LoopAgent
from google.adk.tools import ToolContext
from google.adk.tools.agent_tool import AgentTool

from ..config import MODEL
from ..tools import find_alternate_suppliers


def exit_loop(tool_context: ToolContext) -> dict:
    """End the sourcing revision loop. Call this ONLY when the current sourcing plan
    is feasible (the critic's verdict is 'pass')."""
    tool_context.actions.escalate = True
    return {"status": "loop_exit_requested"}


def make_response_coordinator() -> LlmAgent:
    """Build a fresh response_coordinator: a Loop-Review (planner ⇄ critic) plus
    hedge/renegotiation specialists, all wrapped as Agent-as-Tools."""

    # --- Loop-Review: planner proposes, critic rejects infeasible plans --------
    sourcing_planner = LlmAgent(
        name="sourcing_planner",
        model=MODEL,
        description="Proposes alternate suppliers to mitigate at-risk parts.",
        instruction=(
            "You propose an alternate-sourcing plan for the at-risk parts.\n\n"
            "Impact assessment:\n{impact}\n\n"
            "Previous feasibility critique (may be empty on the first attempt):\n"
            "{feasibility?}\n\n"
            "For the highest-risk part, call `find_alternate_suppliers(part, material)` and "
            "choose alternates that fit the disruption timeline. If a previous critique is "
            "present and says 'fail', you MUST revise — drop or replace any alternate whose "
            "lead_time_days is too slow for the implied disruption window.\n\n"
            "Output ONLY JSON: {\"alternates\":[{\"supplier\":str,\"region\":str,"
            "\"est_unit_cost\":float,\"lead_time_days\":int,\"moq\":int,\"notes\":str}],"
            "\"rationale\":str}. No prose outside the JSON, no fences."
        ),
        tools=[find_alternate_suppliers],
        output_key="sourcing_plan",
    )

    feasibility_critic = LlmAgent(
        name="feasibility_critic",
        model=MODEL,
        description="Rejects sourcing plans whose alternates are too slow to be feasible.",
        instruction=(
            "You are a strict feasibility critic for a sourcing plan.\n\n"
            "Impact assessment:\n{impact}\n\n"
            "Proposed sourcing plan:\n{sourcing_plan}\n\n"
            "Estimate the disruption window from the impact's delay_days (treat it as the "
            "time available to switch sources). FAIL the plan if ANY chosen alternate's "
            "lead_time_days exceeds that window, or if no usable alternate is present.\n\n"
            "First output ONLY JSON: {\"verdict\":\"pass\"|\"fail\",\"reason\":str}.\n"
            "Then, if and only if the verdict is 'pass', call the `exit_loop` tool to end "
            "the revision loop. If 'fail', do NOT call exit_loop."
        ),
        tools=[exit_loop],
        output_key="feasibility",
    )

    mitigation_loop = LoopAgent(
        name="mitigation_loop",
        description="Plan ⇄ critique until the sourcing plan is feasible.",
        max_iterations=3,
        sub_agents=[sourcing_planner, feasibility_critic],
    )

    # --- Specialists (wrapped as Agent-as-Tools) -------------------------------
    hedge_specialist = LlmAgent(
        name="hedge_specialist",
        model=MODEL,
        description="Proposes a hedge/buy-ahead action for FX- or commodity-driven risk.",
        instruction=(
            "Given the impact assessment:\n{impact}\n\n"
            "If risk is driven by FX or commodity price moves, propose ONE concrete hedge or "
            "buy-ahead action (e.g. forward-buy N months of the material, lock an FX forward). "
            "Output ONLY JSON: {\"action\":str,\"rationale\":str}. If hedging does not apply, "
            "output {}."
        ),
        output_key="hedge_plan",
    )

    renegotiation_specialist = LlmAgent(
        name="renegotiation_specialist",
        model=MODEL,
        description="Proposes a renegotiation angle for cost-driven risk.",
        instruction=(
            "Given the impact assessment:\n{impact}\n\n"
            "If risk is cost-driven, propose ONE renegotiation angle with the incumbent "
            "supplier (e.g. volume commitment for price hold, shared cost escalation). "
            "Output ONLY JSON: {\"angle\":str,\"rationale\":str}. If it does not apply, output {}."
        ),
        output_key="reneg_plan",
    )

    # --- Coordinator: decides the response type, synthesizes the plan ----------
    return LlmAgent(
        name="response_coordinator",
        model=MODEL,
        description="Chooses the mitigation response and synthesizes a response plan.",
        instruction=(
            "You decide how to respond to the supply risk and produce a single response plan.\n\n"
            "Impact assessment:\n{impact}\n\n"
            "Decide which mitigations fit, then CALL the matching tools:\n"
            "- If any part is supply-constrained (supplier/weather-driven), you MUST call "
            "`mitigation_loop` to produce a feasible alternate-sourcing plan.\n"
            "- If risk is FX- or commodity-driven, also call `hedge_specialist`.\n"
            "- If risk is purely cost-driven, also call `renegotiation_specialist`.\n\n"
            "After the tools return, synthesize. Output ONLY JSON: "
            "{\"priority_actions\":[str],\"chosen\":[\"resource\"|\"hedge\"|\"renegotiate\"],"
            "\"summary\":str}. `chosen` lists every response type you actually used and must "
            "be non-empty. No prose outside the JSON, no fences."
        ),
        tools=[
            AgentTool(agent=mitigation_loop),
            AgentTool(agent=hedge_specialist),
            AgentTool(agent=renegotiation_specialist),
        ],
        output_key="response_plan",
    )
