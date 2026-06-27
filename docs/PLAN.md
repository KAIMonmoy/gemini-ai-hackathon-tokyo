# Sourcing Sentinel — Implementation Plan

## Context

We are building **Sourcing Sentinel** (see `SPEC.md` / `CASESTUDY.md`): a multi-agent supply-chain
risk radar for small Japanese manufacturers, built on Google ADK + Gemini on Vertex AI.

`SPEC.md` describes the **agent core only** and explicitly excludes auth and a custom frontend.
We are going further: a real product with **signup, business profiles, a risk/alternatives
dashboard, Firestore persistence**, and a GCP deployment — built in a specific order:

1. **Agent core first**, with mock tools, to validate the agentic idea.
2. **Frontend + Firestore + Auth** so a user can sign up, describe their business, and see results.
3. **Backend (FastAPI) + real AI logic + GCP deploy.**
4. **Wire it all together** end-to-end.

**Locked decisions:** stub function tools gated by `USE_STUBS` (not real MCP servers); React+Vite
SPA (Firebase Hosting); custom FastAPI backend wrapping the ADK Runner, verifying Firebase tokens,
and reading/writing Firestore. Gemini runs on the **Vertex path** (ADC already in `.env`).

Environment is ready: `.venv` (Python 3.14), `google-adk 2.3.0`, `google-genai 2.10.0`, gcloud SDK,
project `tokyo-gemini-ai-hackathon`. The only model used throughout is **`gemini-3.5-flash`**
(no fallback). **Still pending:** `gcloud auth application-default login` (ADC).

## Target repository layout (monorepo)

```
ai-hackathon/
├── sourcing_sentinel/        # ADK agent package (SPEC §4) — Phase 1
│   ├── __init__.py           # from . import agent
│   ├── agent.py              # root_agent (SequentialAgent) ENTRY POINT
│   ├── config.py             # MODEL, USE_STUBS, env loading
│   ├── schemas.py            # TypedDicts for the State Contract (SPEC §7)
│   ├── agents/               # intake, sensing, impact, response, comms
│   ├── tools/                # documents, fx, weather, commodity, suppliers
│   └── tests/test_pipeline.py
├── data/                     # sample_bom.json, demo_trigger.json (SPEC §13)
├── backend/                  # FastAPI service — Phase 3
│   ├── main.py               # REST endpoints + CORS
│   ├── auth.py               # Firebase ID-token verification (firebase-admin)
│   ├── store.py              # Firestore read/write helpers
│   ├── runner.py             # wraps ADK Runner around root_agent
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React + Vite SPA — Phase 2
│   ├── src/lib/firebase.ts   # Firebase Auth + Firestore init
│   ├── src/api/client.ts     # calls FastAPI (attaches ID token)
│   ├── src/pages/            # Login, Signup, Profile, Dashboard
│   └── src/components/
├── requirements.txt          # agent deps (exists)
├── .env / .env.example       # Vertex config (exists)
└── README.md
```

---

## Phase 1 — Agent core with stubs (validate the idea)

This is essentially `SPEC.md` milestones **M0–M6**, all offline (`USE_STUBS=true`, no network).

1. **Scaffold (M0):** create the `sourcing_sentinel/` package tree, `config.py`
   (`MODEL=os.getenv("MODEL","gemini-3.5-flash")`, `USE_STUBS` flag), `schemas.py` (TypedDicts per
   SPEC §7), and `data/sample_bom.json` + `data/demo_trigger.json` (SPEC §13 verbatim).
2. **Stub tools (M1):** `tools/{documents,fx,weather,commodity,suppliers}.py`. Each is a typed,
   docstring'd function returning a `dict` matching SPEC §7 shapes; when `USE_STUBS` it returns
   canned data consistent with `demo_trigger.json` (typhoon Kagoshima, USD/JPY +3%, titanium +8%).
   `parse_documents` returns `data/sample_bom.json` under stubs.
3. **Intake agent (M2):** `agents/intake.py` → `doc_intake_agent` (LlmAgent, tool `parse_documents`,
   `output_key="watch_list"`).
4. **Parallel sensing (M3):** `agents/sensing.py` → 4 LlmAgents (news/weather/commodity/fx) with
   **distinct** output keys, wrapped in a `ParallelAgent` `sensing_team`. news/commodity use
   `google_search`; weather/fx use their tools.
5. **Impact fusion (M4):** `agents/impact.py` → `impact_agent` reads `watch_list` + `*_risk`,
   computes `jpy_exposure ≈ qty × unit_cost × delay factor`, `overall_risk = max item risk`.
6. **Response (M5):** `agents/response.py` → `sourcing_planner` + `feasibility_critic` in a
   `LoopAgent(max_iterations=3)` `mitigation_loop`; `hedge_specialist`, `renegotiation_specialist`;
   `response_coordinator` (LlmAgent) calls them via `AgentTool`. Critic must reject a too-slow
   alternate at least once before passing.
7. **Comms + assembly (M6):** `agents/comms.py` → `comms_agent` (JP keigo + EN emails). Assemble
   `root_agent = SequentialAgent([...])` in `agent.py` (SPEC §10). Write `tests/test_pipeline.py`.

**Reuse:** ADK classes confirmed importable — `SequentialAgent, ParallelAgent, LoopAgent, LlmAgent`
from `google.adk.agents`, `AgentTool` from `google.adk.tools.agent_tool`, built-in `google_search`.

**Verify Phase 1:**
- `.venv/bin/python -c "import sourcing_sentinel"` succeeds.
- `.venv/bin/python -m sourcing_sentinel.tests.test_pipeline` passes offline (USE_STUBS=true, no
  network): asserts watch_list → 4 risk keys → impact (titanium bolt flagged) → response_plan →
  ≥1 JP keigo email + ≥1 EN email.
- Eyeball with `.venv/bin/adk run sourcing_sentinel` or `adk web sourcing_sentinel`.

---

## Phase 2 — Frontend, Auth, Firestore (UI against a mocked backend)

Build the SPA independently of the real backend by pointing `src/api/client.ts` at a mock that
returns a canned brief (the same shape the agent produces), so UI work isn't blocked on Phase 3.

1. **Firebase project:** enable **Authentication** (Email/Password + Google) and **Firestore** in
   `tokyo-gemini-ai-hackathon`. Add web app config to `frontend/.env` (`VITE_FIREBASE_*`).
2. **Scaffold SPA:** Vite + React + TypeScript + React Router; `src/lib/firebase.ts` initializes
   Auth + Firestore.
3. **Auth:** Signup/Login pages using Firebase Auth; a route guard; auth context exposing the
   current user + a `getIdToken()` helper.
4. **Business profile page:** form to capture the company + its BOM watch list (part, supplier,
   region, currency, qty, unit_cost, lead_time, SKUs, material — the `WatchListItem` shape), plus a
   BOM file upload control (wired for real in Phase 4). Persists to Firestore.
5. **Dashboard page:** "Run analysis" button → renders the brief: impacted parts + ¥ exposure +
   risk score, ranked mitigation options/alternates, and the draft JP/EN emails. Initially fed by
   the mock client.
6. **Firestore data model & rules:**
   `users/{uid}` (profile), `users/{uid}/watchlist` (items), `users/{uid}/runs/{runId}` (analysis
   results). Security rules: a user can read/write only their own `users/{uid}/**`.

**Verify Phase 2:** `npm run dev` → sign up → create a business profile (saved in Firestore console)
→ dashboard renders the mocked risk brief end-to-end in the browser.

---

## Phase 3 — Backend (FastAPI) + real AI logic + GCP deploy

1. **FastAPI backend** (`backend/`):
   - `auth.py`: verify Firebase ID tokens with `firebase-admin`; FastAPI dependency yields `uid`.
   - `store.py`: Firestore helpers (load watch_list, save run result) via `firebase-admin`/
     `google-cloud-firestore`.
   - `runner.py`: build an ADK `Runner` over `root_agent` with a session service; a `run_analysis`
     coroutine that injects the watch_list into session state, runs the pipeline, and collects the
     final comms output.
   - `main.py`: `POST /analyze` (auth'd: load watch_list from Firestore → run pipeline → persist to
     `users/{uid}/runs` → return brief), `POST /upload-bom` (multimodal intake), `GET /healthz`, CORS.
2. **Real APIs (SPEC M7):** flip `USE_STUBS=false`; implement live `get_fx` (frankfurter.app) and
   `get_weather_logistics` (Open-Meteo); commodity/suppliers stay on `google_search` + curated
   fallback. All network calls in try/except with safe fallback signals (never crash the pipeline).
3. **GCP prep:** run `gcloud auth application-default login`, set quota project, enable
   `run / aiplatform / cloudbuild / artifactregistry`. Model is `gemini-3.5-flash` on Vertex.
4. **Deploy:** containerize the FastAPI backend (`backend/Dockerfile`) → Cloud Run (Vertex path,
   service account granted Vertex AI User + Firestore access). Deploy the SPA to Firebase Hosting.

**Verify Phase 3:** hit the deployed `POST /analyze` with a test Firebase token → returns a brief
computed from live FX/weather; the run document appears in Firestore.

---

## Phase 4 — Wire everything together (end-to-end)

1. Point `frontend/.env` `VITE_API_BASE` at the deployed Cloud Run URL; remove the mock client.
2. Real flow: signup → profile + **BOM upload** → `POST /upload-bom` runs real multimodal
   `parse_documents` (Gemini) → watch_list saved to Firestore → "Run analysis" → real pipeline →
   dashboard shows the real brief + emails; results persisted under `users/{uid}/runs`.
3. Make the SPEC §14 demo scenario reproduce deterministically (seed-data path) for the 2-minute demo.
4. Update `README.md`: setup, local run, deploy, and which streams are live vs stubbed.

**Verify Phase 4 (definition of done):** deployed public URL → sign up → create profile → upload a
BOM → get a risk brief with ¥ exposure + feasibility-checked alternates + JP keigo & EN emails;
demo scenario reproduces from seed data.

---

## Key technical notes / risks

- **Model:** the only model used anywhere is `gemini-3.5-flash`; `config.py` defaults to it
  (`MODEL=os.getenv("MODEL","gemini-3.5-flash")`). No fallback model.
- **ADK Runner in a request/response API:** use a session service (in-memory is fine for the demo),
  create a session per request, inject `watch_list` into state, run to completion, read the final
  event. This is the main integration seam between Phase 1's agents and Phase 3's backend.
- **BOM upload path:** the web flow uploads files to the backend (temp/GCS), then passes paths to
  `parse_documents`; under `USE_STUBS` it ignores them and returns seed data.
- **Auth boundary:** all data access is server-side through verified Firebase tokens; Firestore rules
  additionally scope every user to `users/{uid}/**`.
- **New dependencies:** backend adds `firebase-admin` (+ `google-cloud-firestore`); frontend adds
  `firebase`, `react-router-dom`, Vite/React toolchain (npm).
- **Scope guardrail:** drafts only, no real procurement/ordering (SPEC §15). Keep agent instructions
  short and JSON-strict; downstream agents parse defensively.
```
