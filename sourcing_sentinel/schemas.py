"""State Contract types (SPEC §7).

These TypedDicts document the JSON shapes agents read/write through
``session.state``. They are the single source of truth for inter-agent data;
agents emit JSON matching these shapes and parse downstream values defensively.
"""

from __future__ import annotations

from typing import TypedDict


class WatchListItem(TypedDict):
    part: str
    supplier: str
    supplier_region: str
    country: str
    currency: str  # e.g. "JPY", "USD"
    qty_per_month: int
    unit_cost: float
    lead_time_days: int
    skus: list[str]  # finished SKUs this part feeds
    material: str  # e.g. "titanium", "ABS resin"


class WatchList(TypedDict):
    items: list[WatchListItem]
    currency_home: str  # e.g. "JPY"


class RiskSignal(TypedDict):
    stream: str  # "news" | "weather" | "commodity" | "fx"
    affected: list[str]  # supplier names / regions / materials / currencies
    severity: int  # 1-5
    detail: str  # one-line human summary
    source: str  # url or "stub"


class RiskReport(TypedDict):
    signals: list[RiskSignal]


class ImpactItem(TypedDict):
    part: str
    skus: list[str]
    cause: str  # which signal(s) drove this
    delay_days: int
    jpy_exposure: int  # estimated ¥ at risk
    risk_score: int  # 1-5


class Impact(TypedDict):
    items: list[ImpactItem]
    overall_risk: int
    summary: str


class Alternate(TypedDict):
    supplier: str
    region: str
    est_unit_cost: float
    lead_time_days: int
    moq: int
    notes: str


class SourcingPlan(TypedDict):
    alternates: list[Alternate]
    rationale: str


class Feasibility(TypedDict):
    verdict: str  # "pass" | "fail"
    reason: str


class ResponsePlan(TypedDict):
    priority_actions: list[str]
    chosen: list[str]  # any of "resource" | "hedge" | "renegotiate"
    summary: str


class Email(TypedDict):
    to: str
    lang: str  # "JP" | "EN"
    subject: str
    body: str


class CommsOutput(TypedDict):
    emails: list[Email]
    notes: str
