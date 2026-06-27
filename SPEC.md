# SPEC.md — Sourcing Sentinel

> **This file is the build spec for Claude Code.** It describes a multi-agent app to build with Google's Agent Development Kit (ADK). Build it **incrementally, milestone by milestone (M0→M7)**, and after each milestone run its acceptance check before moving on. **Stub all external APIs first**, get the whole pipeline green end-to-end with stubs, then swap real APIs in. Do **not** over-build beyond the Non-Goals. When a fact is marked `VERIFY`, check current docs rather than assuming.

---

## 0. How to use this doc (instructions to the coding agent)

1. Read the whole file once before writing code.
2. Follow the **Build Plan (§11)** in order. Each milestone has an **Acceptance check** — make it pass before continuing.
3. Keep the **State Contract (§7)** as the single source of truth for how agents pass data. Every agent reads/writes only the keys defined there.
4. Prefer small, readable functions with docstrings + type hints (ADK uses tool docstrings to decide tool use).
5. Commit after each green milestone with a clear message.
6. If something in the I/O 2026 stack (`gemini-3.5-flash` id, Managed Agents API, Antigravity) can't be confirmed, fall back to the documented ADK + Gemini path described here and leave a `# VERIFY:` comment.

---

## 1. What we're building

**Sourcing Sentinel** — an always-on supply-chain risk radar for small Japanese manufacturers (SMEs). It:
1. Ingests the SME's **Bill of Materials (BOM) and invoices** from messy real files (PDF / Excel / photo) using Gemini multimodal → builds a structured **watch list**.
2. Watches four independent risk streams **in parallel** (news, weather/logistics, commodity prices, FX).
3. **Fuses** those signals against the watch list to compute **which of the SME's parts/SKUs are at risk and the ¥ exposure**.
4. Decides a **mitigation response** (re-source / hedge / renegotiate) and refines a sourcing plan with a **critique loop** until it's feasible.
5. Drafts **ready-to-send emails in keigo (formal Japanese) + English**.

It is deployed to **Cloud Run** with the ADK web UI, producing a public URL (a hackathon submission requirement).

### Target judging criteria this must satisfy
- **Google Cloud integration** (pass/fail): Gemini + ADK + Cloud Run. Optionally Vertex AI.
- **Innovation**: multi-agent (5 canonical patterns) + multimodal document intake.
- **Completeness**: works end-to-end and is demo-ready in 2 minutes.
- **Deployed link**: public Cloud Run URL.

---

## 2. Architecture & the five agent patterns

A **Sequential** mission pipeline is the spine. Stage 2 is **Parallel**. Stage 4 is a **Coordinator** that calls a **Loop-Review** loop and other specialists as **Agent-as-Tools**.

```
root_agent  (SequentialAgent)
├── doc_intake_agent        # MULTIMODAL → writes state["watch_list"]
├── sensing_team            # ParallelAgent (concurrent)
│   ├── news_agent          → state["news_risk"]
│   ├── weather_agent       → state["weather_risk"]
│   ├── commodity_agent     → state["commodity_risk"]
│   └── fx_agent            → state["fx_risk"]
├── impact_agent            # fuses signals → state["impact"]
├── response_coordinator    # Coordinator + Agent-as-Tool → state["response_plan"]
│   ├── tool: mitigation_loop        # LoopAgent: planner ⇄ critic
│   ├── tool: hedge_specialist
│   └── tool: renegotiation_specialist
└── comms_agent             # drafts keigo emails → final output
```

| Pattern | Component | Why |
|---|---|---|
| Parallel | `sensing_team` | 4 independent streams, faster, isolated context, distinct output keys |
| Sequential | `root_agent` | each stage depends on prior state |
| Loop-Review | `mitigation_loop` | planner proposes, critic rejects infeasible plans, repeat |
| Coordinator | `response_coordinator` | situation decides the response type |
| Agent-as-Tool | specialists wrapped in `AgentTool` | coordinator stays in control (avoid naive sub-agent transfer) |

---

## 3. Tech stack

| Thing | Choice | Note |
|---|---|---|
| Language | Python 3.10+ | ADK requirement |
| Agent framework | `google-adk` | LlmAgent, SequentialAgent, ParallelAgent, LoopAgent, AgentTool |
| Model | `gemini-3.5-flash` | `VERIFY` exact id in AI Studio; fall back to `gemini-2.5-flash` if unavailable |
| Multimodal parsing | `google-genai` SDK | send file bytes + JSON-schema prompt to Gemini |
| HTTP | `requests` | free APIs |
| Config | `python-dotenv` | `.env` |
| Deploy | Cloud Run via `adk deploy cloud_run --with_ui` | gives public URL + browser UI |
| Auth | `gcloud auth application-default login` | ADC |

---

## 4. Repository structure

Create exactly this (ADK's deploy command requires `root_agent` discoverable in the agent package):

```
sourcing-sentinel/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
├── data/
│   ├── sample_bom.json          # seed watch_list for offline tests (see §13)
│   └── demo_trigger.json        # scripted disruption for the demo (see §13)
└── sourcing_sentinel/
    ├── __init__.py              # `from . import agent`
    ├── agent.py                 # defines root_agent (ENTRY POINT)
    ├── agents/
    │   ├── __init__.py
    │   ├── intake.py            # doc_intake_agent
    │   ├── sensing.py           # news/weather/commodity/fx + sensing_team
    │   ├── impact.py            # impact_agent
    │   ├── response.py          # mitigation_loop, specialists, response_coordinator
    │   └── comms.py             # comms_agent
    ├── tools/
    │   ├── __init__.py
    │   ├── documents.py         # parse_documents (multimodal)
    │   ├── fx.py                # get_fx
    │   ├── weather.py           # get_weather_logistics
    │   ├── commodity.py         # get_commodity_prices
    │   └── suppliers.py         # find_alternate_suppliers
    ├── schemas.py               # dataclasses / TypedDicts for the State Contract
    ├── config.py                # MODEL, env loading, USE_STUBS flag
    └── tests/
        ├── __init__.py
        └── test_pipeline.py     # offline end-to-end test using stubs
```

`sourcing_sentinel/agent.py` must expose a module-level `root_agent`. `sourcing_sentinel/__init__.py` must contain `from . import agent`.

---

## 5. Environment & config

`.env.example` (copy to `.env`):
```
# Choose ONE auth path.
# Path A — AI Studio API key (simplest for local/dev):
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=your-aistudio-key

# Path B — Vertex AI (used for Cloud Run deploy):
# GOOGLE_GENAI_USE_VERTEXAI=TRUE
# GOOGLE_CLOUD_PROJECT=your-project-id
# GOOGLE_CLOUD_LOCATION=us-central1

# App flags
USE_STUBS=true          # true = no external API calls (offline-safe). Flip to false to use real APIs.
```

`config.py` responsibilities: load `.env`, expose `MODEL = os.getenv("MODEL", "gemini-3.5-flash")`, expose `USE_STUBS = os.getenv("USE_STUBS","true").lower()=="true"`.

`.gitignore` must include `.env`, `__pycache__/`, `*.pyc`, `.venv/`.

---

## 6. Dependencies (`requirements.txt`)

```
google-adk
google-genai
requests
python-dotenv
```
(Pin versions if the build is reproducible-critical; otherwise latest is fine for a hackathon.)

---

## 7. State Contract (the single source of truth)

Every agent communicates only through these `session.state` keys. `output_key` writes a key; `{key}` templating in an instruction reads it. **Define matching TypedDicts in `schemas.py`.** Keep JSON shapes stable — agents downstream depend on them.

```python
# schemas.py (shapes; agents should emit JSON matching these)

WatchListItem = {
  "part": str, "supplier": str, "supplier_region": str, "country": str,
  "currency": str,                      # e.g. "JPY", "USD"
  "qty_per_month": int, "unit_cost": float,
  "lead_time_days": int,
  "skus": list,                         # finished SKUs this part feeds
  "material": str                       # e.g. "titanium", "ABS resin"
}
# state["watch_list"] = {"items": [WatchListItem, ...], "currency_home": "JPY"}

RiskSignal = {
  "stream": str,                        # "news"|"weather"|"commodity"|"fx"
  "affected": list,                     # supplier names / regions / materials / currencies
  "severity": int,                      # 1-5
  "detail": str,                        # one-line human summary
  "source": str                         # url or "stub"
}
# state["news_risk"]      = {"signals": [RiskSignal, ...]}
# state["weather_risk"]   = {"signals": [...]}
# state["commodity_risk"] = {"signals": [...]}
# state["fx_risk"]        = {"signals": [...]}

ImpactItem = {
  "part": str, "skus": list,
  "cause": str,                         # which signal(s) drove this
  "delay_days": int,
  "jpy_exposure": int,                  # estimated ¥ at risk
  "risk_score": int                     # 1-5
}
# state["impact"] = {"items": [ImpactItem, ...], "overall_risk": int, "summary": str}

# state["sourcing_plan"]  = {"alternates": [{"supplier","region","est_unit_cost","lead_time_days","moq","notes"}], "rationale": str}
# state["feasibility"]    = {"verdict": "pass"|"fail", "reason": str}
# state["hedge_plan"]     = {"action": str, "rationale": str}      # may be {} if N/A
# state["reneg_plan"]     = {"angle": str, "rationale": str}       # may be {} if N/A
# state["response_plan"]  = {"priority_actions": [str,...], "chosen": ["resource"|"hedge"|"renegotiate"], "summary": str}
# comms_agent final output (not a state key): {"emails": [{"to","lang","subject","body"}], "notes": str}
```

> Rule: parallel agents (`news/weather/commodity/fx`) MUST use **distinct** output keys (above). Never write the same key from two parallel agents.

---

## 8. Tools spec (`tools/`)

Each tool is a plain function with a precise docstring + type hints, returns a `dict`, and **respects `USE_STUBS`**: when `USE_STUBS` is true, return deterministic canned data (so tests/demo never depend on the network).

### `tools/documents.py → parse_documents`
```python
def parse_documents(file_paths: list[str]) -> dict:
    """Extract a structured watch_list from BOM/invoice files (PDF, image, or xlsx).
    Uses Gemini multimodal to read each file and return JSON matching the WatchList shape.
    Args:
        file_paths: local paths to uploaded BOM/invoice files.
    Returns:
        {"items": [WatchListItem,...], "currency_home": "JPY"}
    """
```
Implementation: if `USE_STUBS`, return `data/sample_bom.json`. Else use `google-genai`:
- `from google import genai`; `client = genai.Client()`
- Upload/inline the file bytes as a `Part` and prompt: *"Extract the bill of materials as JSON with this schema {…}. Return ONLY JSON."*
- Parse JSON (strip ```json fences). `VERIFY` the exact `google-genai` file-part call against current SDK docs.

### `tools/fx.py → get_fx`
```python
def get_fx(currencies: list[str]) -> dict:
    """Get JPY exchange-rate moves vs each currency. Flags adverse moves for a JPY importer.
    Returns: {"signals":[RiskSignal,...]}"""
```
Real source: **frankfurter.app** (free, no key), e.g. `https://api.frankfurter.app/latest?from=USD&to=JPY` and a historical date for % change. Stub: USD/JPY up 3% → severity 3.

### `tools/weather.py → get_weather_logistics`
```python
def get_weather_logistics(regions: list[str]) -> dict:
    """Check severe weather / port-logistics risk for supplier regions.
    Returns: {"signals":[RiskSignal,...]}"""
```
Real source: **Open-Meteo** (free, no key) for severe weather by lat/long; use a small region→coords map. Port status can come from `google_search` grounding inside the agent. Stub: typhoon near Kyushu → severity 4.

### `tools/commodity.py → get_commodity_prices`
```python
def get_commodity_prices(materials: list[str]) -> dict:
    """Check recent price moves for raw materials. Returns: {"signals":[RiskSignal,...]}"""
```
No reliable free API — prefer letting the `commodity_agent` use `google_search`. Provide a stub: titanium +8% → severity 3.

### `tools/suppliers.py → find_alternate_suppliers`
```python
def find_alternate_suppliers(part: str, material: str, region_pref: str = "Japan") -> dict:
    """Find candidate alternate suppliers for a part. Returns:
    {"alternates":[{"supplier","region","est_unit_cost","lead_time_days","moq","notes"}]}"""
```
**Weakest data point — do not fake a verified DB.** Implementation: `google_search` grounding + a small curated fallback list in the function. Stub: 2 plausible alternates with differing lead times (so the critic can reject one).

---

## 9. Agents spec (`agents/`)

All agents use `model=MODEL` from config. Instructions below are summaries — expand them into clear, specific system instructions. Where an instruction reads state, use `{key}` templating.

| Agent | File | Type | Reads | output_key | Tools/sub_agents |
|---|---|---|---|---|---|
| `doc_intake_agent` | intake.py | LlmAgent | (file paths from user msg) | `watch_list` | `parse_documents` |
| `news_agent` | sensing.py | LlmAgent | `watch_list` | `news_risk` | `google_search` |
| `weather_agent` | sensing.py | LlmAgent | `watch_list` | `weather_risk` | `get_weather_logistics`, `google_search` |
| `commodity_agent` | sensing.py | LlmAgent | `watch_list` | `commodity_risk` | `get_commodity_prices`, `google_search` |
| `fx_agent` | sensing.py | LlmAgent | `watch_list` | `fx_risk` | `get_fx` |
| `sensing_team` | sensing.py | ParallelAgent | — | — | sub_agents = the 4 above |
| `impact_agent` | impact.py | LlmAgent | `watch_list`,`*_risk` | `impact` | — |
| `sourcing_planner` | response.py | LlmAgent | `impact` | `sourcing_plan` | `find_alternate_suppliers`, `google_search` |
| `feasibility_critic` | response.py | LlmAgent | `sourcing_plan`,`impact` | `feasibility` | — |
| `mitigation_loop` | response.py | LoopAgent (max_iterations=3) | — | — | sub_agents = [planner, critic] |
| `hedge_specialist` | response.py | LlmAgent | `impact` | `hedge_plan` | — |
| `renegotiation_specialist` | response.py | LlmAgent | `impact` | `reneg_plan` | — |
| `response_coordinator` | response.py | LlmAgent | `impact` | `response_plan` | AgentTool(mitigation_loop), AgentTool(hedge_specialist), AgentTool(renegotiation_specialist) |
| `comms_agent` | comms.py | LlmAgent | `impact`,`response_plan` | (final) | — |

Key instruction notes:
- `impact_agent`: must output JSON matching `state["impact"]`, computing `jpy_exposure` ≈ affected qty × unit_cost × delay factor; pick `overall_risk` = max item risk.
- `feasibility_critic`: output exactly `{"verdict":"pass"|"fail","reason":...}`; fail if any chosen alternate's `lead_time_days` exceeds the disruption window implied by `impact`.
- `response_coordinator`: read `impact`, decide which tools to call (re-source if supplier/weather-driven; hedge if fx/commodity-driven; renegotiate if cost-driven), synthesize `response_plan`. Must call at least the mitigation_loop when a part is supply-constrained.
- `comms_agent`: produce both JP (keigo) and EN versions; subject + body; one email to incumbent (status/expedite) and, if alternates chosen, one RFQ. Tone: polite, concise, business-appropriate.

---

## 10. Orchestration (`agent.py`)

Assemble and expose `root_agent`:
```python
from google.adk.agents import SequentialAgent
from .agents.intake import doc_intake_agent
from .agents.sensing import sensing_team
from .agents.impact import impact_agent
from .agents.response import response_coordinator
from .agents.comms import comms_agent

root_agent = SequentialAgent(
    name="sourcing_sentinel",
    sub_agents=[doc_intake_agent, sensing_team, impact_agent,
                response_coordinator, comms_agent],
)
```

---

## 11. Build Plan (do in order; make each Acceptance check pass)

**M0 — Scaffold.** Create the repo tree (§4), `requirements.txt`, `.env.example`, `.gitignore`, `config.py`, `schemas.py`, empty packages, and a venv. Set `USE_STUBS=true`.
- *Acceptance:* `pip install -r requirements.txt` succeeds; `python -c "import sourcing_sentinel"` works.

**M1 — Tools with stubs.** Implement all five tools returning canned stub data (no network) when `USE_STUBS`.
- *Acceptance:* a scratch script calling each tool returns dicts matching §7 shapes.

**M2 — Intake agent.** Build `doc_intake_agent` (uses `parse_documents`; stub returns `data/sample_bom.json`).
- *Acceptance:* `adk run sourcing_sentinel` (or a unit call) yields `state["watch_list"]` with ≥3 items.

**M3 — Parallel sensing.** Build the 4 sensing agents + `sensing_team` (stubs). Wire a temporary `SequentialAgent([doc_intake_agent, sensing_team])`.
- *Acceptance:* after a run, all four `*_risk` keys exist with `signals` arrays; no key collisions.

**M4 — Impact fusion.** Build `impact_agent`; assemble pipeline up to impact.
- *Acceptance:* `state["impact"]` lists at least one at-risk part with `jpy_exposure` and `risk_score`, traceable to a stubbed signal (titanium/Kyushu).

**M5 — Response (Loop + Coordinator + AgentTools).** Build planner, critic, `mitigation_loop`, the two specialists, and `response_coordinator`.
- *Acceptance:* with a stub plan whose first alternate is too slow, `feasibility_critic` returns `fail` at least once and the loop produces a final feasible `sourcing_plan`; `response_plan.chosen` is non-empty.

**M6 — Comms + full pipeline.** Build `comms_agent`; finalize `root_agent` (§10). Run end-to-end offline.
- *Acceptance:* `python -m sourcing_sentinel.tests.test_pipeline` runs the full pipeline with stubs and asserts: watch_list→risks→impact→response_plan→emails (≥1 JP keigo email + ≥1 EN). Test must pass with `USE_STUBS=true` and **no network**.

**M7 — Real APIs + Deploy.** Flip `USE_STUBS=false`; implement real `get_fx` (frankfurter.app) and `get_weather_logistics` (Open-Meteo); keep commodity/suppliers on `google_search` + fallback. Then deploy (§12).
- *Acceptance:* `adk web sourcing_sentinel` works locally with live FX/weather; `adk deploy cloud_run --with_ui` returns a reachable public URL whose UI runs the agent.

> If time is short, ship M6 (fully working on stubs) + deploy that. A deployed, working stub demo beats a half-wired live one.

---

## 12. Run & deploy

Local:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in key
adk web sourcing_sentinel     # browser playground
# or
adk run sourcing_sentinel     # terminal
python -m sourcing_sentinel.tests.test_pipeline   # offline e2e
```

Deploy to Cloud Run (public URL = submission link):
```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com aiplatform.googleapis.com cloudbuild.googleapis.com

# Use Vertex path for deploy: set in .env → GOOGLE_GENAI_USE_VERTEXAI=TRUE, project, location
adk deploy cloud_run \
  --project=YOUR_PROJECT_ID \
  --region=us-central1 \
  --service_name=sourcing-sentinel \
  --with_ui
```
`--with_ui` bundles the ADK web UI so the URL is demoable in a browser. The command builds the container, pushes to Artifact Registry, and prints the service URL. `VERIFY` flags/permissions against current ADK docs if it errors (commonly needs Artifact Registry API + Cloud Build service-account roles).

---

## 13. Seed data (create these)

`data/sample_bom.json`:
```json
{
  "currency_home": "JPY",
  "items": [
    {"part":"M3 titanium bolt","supplier":"Tanaka Seiko","supplier_region":"Kagoshima","country":"Japan","currency":"JPY","qty_per_month":12000,"unit_cost":18.0,"lead_time_days":14,"skus":["A-100","A-110","B-200","B-210"],"material":"titanium"},
    {"part":"ABS housing","supplier":"Maruyama Plastics","supplier_region":"Osaka","country":"Japan","currency":"JPY","qty_per_month":3000,"unit_cost":120.0,"lead_time_days":21,"skus":["A-100"],"material":"ABS resin"},
    {"part":"control IC","supplier":"Shenzhen MicroTech","supplier_region":"Shenzhen","country":"China","currency":"USD","qty_per_month":2000,"unit_cost":3.4,"lead_time_days":35,"skus":["A-100","B-200"],"material":"semiconductor"}
  ]
}
```

`data/demo_trigger.json` (the scripted disruption the stubs should reflect):
```json
{
  "weather": {"region":"Kagoshima","event":"typhoon landfall ~36h","severity":4},
  "fx": {"pair":"USD/JPY","move_pct":3.0,"severity":3},
  "commodity": {"material":"titanium","move_pct":8.0,"severity":3},
  "news": []
}
```
Stub tools should return signals consistent with this file so the demo is deterministic.

---

## 14. Demo scenario (what the final run should show)

Input: upload `sample_bom.json`-equivalent (or a BOM PDF) → trigger reflects `demo_trigger.json`. Expected output chain:
1. watch_list with 3 parts.
2. Parallel signals: typhoon near Kagoshima (weather), USD/JPY +3% (fx), titanium +8% (commodity).
3. impact: **M3 titanium bolt** flagged (Tanaka Seiko in Kagoshima + titanium spike) → affects SKUs A-100/A-110/B-200/B-210, delay ~X days, ¥ exposure computed, risk 4–5.
4. response_coordinator chooses re-source (loop) + possibly hedge (titanium/FX). Critic rejects a too-slow alternate once; final plan feasible.
5. comms: a keigo expedite email to Tanaka Seiko + an RFQ to the chosen alternate, JP + EN.

---

## 15. Non-Goals / scope guardrails (do NOT build these)

- No user auth, accounts, billing, or multi-tenant DB.
- No real procurement integrations / ordering. (Drafts only.)
- No persistent database unless trivially needed; in-run `session.state` is enough for the demo.
- No custom React frontend required — `adk deploy ... --with_ui` is the UI. (A tiny optional static page is fine only if M0–M7 are done.)
- No Antigravity/Managed Agents dependency required to function. (Optional: mention `/schedule` in Antigravity for the live-fleet narrative, but the graded artifact is the Cloud Run app.)
- Don't claim verified supplier data you don't have.
- Don't exceed `max_iterations` safety on loops.

---

## 16. Coding conventions

- Type hints + docstrings on every tool (ADK relies on them).
- Agents emit JSON matching §7; downstream agents parse defensively (strip ```json fences, tolerate missing optional keys).
- All network calls behind `USE_STUBS` and wrapped in try/except with a safe fallback signal (never crash the pipeline on a flaky API).
- Keep instructions specific and short; one job per agent.
- Log each agent's output_key write at INFO level for demo visibility.

## 17. Definition of done

- [ ] `USE_STUBS=true` full pipeline test passes offline (M6).
- [ ] Live FX + weather work with `USE_STUBS=false` (M7).
- [ ] `adk deploy cloud_run --with_ui` yields a public URL that runs the agent end-to-end.
- [ ] Demo scenario (§14) reproduces deterministically from seed data.
- [ ] README documents setup, run, deploy, and which streams are live vs stubbed.
