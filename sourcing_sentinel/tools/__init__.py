"""Plain-function tools used by the agents.

Every tool returns a ``dict`` matching the State Contract (SPEC §7) and honors
``config.USE_STUBS``: when stubs are on, tools return deterministic canned data
consistent with ``data/demo_trigger.json`` and never touch the network.
"""

from .commodity import get_commodity_prices
from .documents import parse_documents
from .fx import get_fx
from .suppliers import find_alternate_suppliers
from .weather import get_weather_logistics

__all__ = [
    "parse_documents",
    "get_fx",
    "get_weather_logistics",
    "get_commodity_prices",
    "find_alternate_suppliers",
]
