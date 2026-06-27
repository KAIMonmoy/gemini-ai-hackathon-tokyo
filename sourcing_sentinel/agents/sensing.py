"""Stage 2 — parallel sensing.

Four specialists watch independent risk streams concurrently and each write a
DISTINCT output key (SPEC §7 rule: parallel agents never share an output key).

Note on tools: Gemini cannot combine the built-in ``google_search`` tool with
function tools in a single agent, so only the news agent uses search grounding;
weather/commodity/fx each use their dedicated function tool (which carries the
demo stub data). This is a deliberate deviation from SPEC §9's tool columns.
"""

from __future__ import annotations

from google.adk.agents import LlmAgent, ParallelAgent
from google.adk.tools import google_search

from ..config import MODEL
from ..tools import get_commodity_prices, get_fx, get_weather_logistics

_SIGNAL_SHAPE = (
    'Output ONLY JSON of the form {"signals":[{"stream":str,"affected":[str],'
    '"severity":1-5,"detail":str,"source":str}]} — no prose, no markdown fences. '
    "If there is no material risk, output {\"signals\":[]}."
)

def make_sensing_team() -> ParallelAgent:
    """Build a fresh sensing_team (4 specialists + parallel wrapper) per call."""
    news_agent = LlmAgent(
        name="news_agent",
        model=MODEL,
        description="Watches news for disruptions affecting the company's suppliers/regions.",
        instruction=(
            "The watch list is:\n{watch_list}\n\n"
            "Use Google Search to look for recent news (shutdowns, fires, strikes, "
            "insolvency, accidents) affecting any supplier or supplier_region above. "
            "Summarize each relevant finding as a risk signal with stream='news', the "
            "affected supplier/region, a 1-5 severity, a one-line detail, and the source URL.\n"
            + _SIGNAL_SHAPE
        ),
        tools=[google_search],
        output_key="news_risk",
    )

    weather_agent = LlmAgent(
        name="weather_agent",
        model=MODEL,
        description="Watches severe weather / port-logistics risk for supplier regions.",
        instruction=(
            "The watch list is:\n{watch_list}\n\n"
            "Collect the distinct supplier_region values and call `get_weather_logistics` "
            "with them. Convert its returned signals into the output shape, keeping "
            "stream='weather'.\n" + _SIGNAL_SHAPE
        ),
        tools=[get_weather_logistics],
        output_key="weather_risk",
    )

    commodity_agent = LlmAgent(
        name="commodity_agent",
        model=MODEL,
        description="Watches raw-material price moves for the company's parts.",
        instruction=(
            "The watch list is:\n{watch_list}\n\n"
            "Collect the distinct `material` values and call `get_commodity_prices` with "
            "them. Convert its returned signals into the output shape, keeping "
            "stream='commodity'.\n" + _SIGNAL_SHAPE
        ),
        tools=[get_commodity_prices],
        output_key="commodity_risk",
    )

    fx_agent = LlmAgent(
        name="fx_agent",
        model=MODEL,
        description="Watches JPY FX moves against the currencies the company buys in.",
        instruction=(
            "The watch list is:\n{watch_list}\n\n"
            "Collect the distinct non-JPY `currency` values and call `get_fx` with them. "
            "Convert its returned signals into the output shape, keeping stream='fx'.\n"
            + _SIGNAL_SHAPE
        ),
        tools=[get_fx],
        output_key="fx_risk",
    )

    return ParallelAgent(
        name="sensing_team",
        description="Runs the four risk-sensing specialists concurrently.",
        sub_agents=[news_agent, weather_agent, commodity_agent, fx_agent],
    )
