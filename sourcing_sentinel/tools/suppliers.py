"""Alternate-supplier discovery.

This is the weakest data point — there is no free, verified supplier directory,
so we never claim a verified DB. Stubs return two plausible candidates with
*different* lead times so the feasibility critic can reject the slow one.
"""

from __future__ import annotations

import logging

from ..config import USE_STUBS

logger = logging.getLogger(__name__)


def find_alternate_suppliers(part: str, material: str, region_pref: str = "Japan") -> dict:
    """Find candidate alternate suppliers for a part.

    Args:
        part: the part needing an alternate, e.g. "M3 titanium bolt".
        material: the part's raw material, e.g. "titanium".
        region_pref: preferred sourcing region (default "Japan").

    Returns:
        {"alternates": [{"supplier","region","est_unit_cost","lead_time_days","moq","notes"}]}
    """
    if USE_STUBS:
        logger.info("find_alternate_suppliers: USE_STUBS -> 2 candidates for %s", part)
        return {
            "alternates": [
                {
                    "supplier": "Kyushu Precision Fasteners",
                    "region": "Fukuoka, Japan",
                    "est_unit_cost": 19.5,
                    "lead_time_days": 12,
                    "moq": 5000,
                    "notes": "Same prefecture cluster; fast but slightly higher unit cost.",
                },
                {
                    "supplier": "Hokuriku Bolt Works",
                    "region": "Toyama, Japan",
                    "est_unit_cost": 17.8,
                    "lead_time_days": 45,
                    "moq": 20000,
                    "notes": "Cheaper but long lead time and high MOQ — likely too slow for an urgent disruption.",
                },
            ]
        }

    # In live mode the sourcing_planner uses google_search grounding to propose
    # candidates; this curated fallback keeps the pipeline useful if search is thin.
    logger.info("find_alternate_suppliers: live mode -> curated fallback for %s", material)
    return {
        "alternates": [
            {
                "supplier": f"Regional {material} specialist (search-grounded)",
                "region": region_pref,
                "est_unit_cost": 0.0,
                "lead_time_days": 30,
                "moq": 0,
                "notes": "Placeholder fallback; confirm via search grounding before relying on it.",
            }
        ]
    }
