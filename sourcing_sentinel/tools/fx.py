"""Foreign-exchange risk for a JPY importer."""

from __future__ import annotations

import logging

from ..config import USE_STUBS

logger = logging.getLogger(__name__)

# Adverse-move threshold (%) at which a JPY-weakening move becomes a signal.
_ADVERSE_PCT = 1.5


def get_fx(currencies: list[str]) -> dict:
    """Get JPY exchange-rate moves vs each currency and flag adverse moves.

    For a JPY importer, JPY weakening against a buying currency raises input cost.

    Args:
        currencies: foreign currencies the company buys in, e.g. ["USD", "EUR"].

    Returns:
        {"signals": [RiskSignal, ...]}
    """
    if USE_STUBS:
        logger.info("get_fx: USE_STUBS -> USD/JPY +3%%")
        return {
            "signals": [
                {
                    "stream": "fx",
                    "affected": ["USD"],
                    "severity": 3,
                    "detail": "USD/JPY up ~3% over 30 days; USD-priced parts cost more in yen.",
                    "source": "stub",
                }
            ]
        }

    # --- Real path (Phase 3): frankfurter.app (free, no key) -------------------
    import datetime as _dt

    import requests

    signals: list[dict] = []
    today = _dt.date.today()
    month_ago = today - _dt.timedelta(days=30)
    for cur in currencies:
        cur = cur.upper()
        if cur == "JPY":
            continue
        try:
            now = requests.get(
                f"https://api.frankfurter.app/latest?from={cur}&to=JPY", timeout=10
            ).json()["rates"]["JPY"]
            then = requests.get(
                f"https://api.frankfurter.app/{month_ago.isoformat()}?from={cur}&to=JPY",
                timeout=10,
            ).json()["rates"]["JPY"]
            move = (now - then) / then * 100.0
            if move >= _ADVERSE_PCT:  # JPY weakened vs this currency
                severity = 2 if move < 3 else (3 if move < 6 else 4)
                signals.append(
                    {
                        "stream": "fx",
                        "affected": [cur],
                        "severity": severity,
                        "detail": f"{cur}/JPY up ~{move:.1f}% over 30 days; raises {cur}-priced input cost.",
                        "source": "https://api.frankfurter.app",
                    }
                )
        except Exception:  # safe fallback: never crash the pipeline on a flaky API
            logger.exception("get_fx: lookup failed for %s", cur)
    return {"signals": signals}
