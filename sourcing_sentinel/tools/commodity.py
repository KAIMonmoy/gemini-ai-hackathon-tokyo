"""Raw-material price-move risk."""

from __future__ import annotations

import logging

from ..config import USE_STUBS

logger = logging.getLogger(__name__)


def get_commodity_prices(materials: list[str]) -> dict:
    """Check recent price moves for the raw materials in the company's parts.

    Args:
        materials: raw materials to check, e.g. ["titanium", "ABS resin"].

    Returns:
        {"signals": [RiskSignal, ...]}
    """
    if USE_STUBS:
        logger.info("get_commodity_prices: USE_STUBS -> titanium +8%%")
        return {
            "signals": [
                {
                    "stream": "commodity",
                    "affected": ["titanium"],
                    "severity": 3,
                    "detail": "Titanium spot price up ~8% recently; raises cost of titanium parts.",
                    "source": "stub",
                }
            ]
        }

    # No reliable free commodity API. In production the commodity_agent leans on
    # google_search grounding; this tool returns no signals when live so it never
    # fabricates data.
    logger.info("get_commodity_prices: live mode -> defer to search grounding")
    return {"signals": []}
