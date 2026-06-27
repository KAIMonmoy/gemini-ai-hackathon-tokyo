# Sourcing Sentinel

> An always-on, multi-agent **supply-chain risk radar** for small Japanese manufacturers.
> Built on the Google Cloud / Gemini agentic stack and deployed as a single **Cloud Run**
> service in **Tokyo (asia-northeast1)**.
>
> Gemini AI Hackathon — Tokyo.

**🔗 Live app:** https://sourcing-sentinel-h3rjzaz5ca-an.a.run.app

It reads a manufacturer's messy paperwork (BOM + invoices), watches four risk streams in
parallel (news, weather/logistics, commodity prices, FX), quantifies the ¥ exposure to
*their* parts, plans a feasibility-checked mitigation, and drafts ready-to-send supplier
emails in **keigo (Japanese) + English**.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for diagrams, the agent roster, and the
Google products used. Background: [docs/CASESTUDY.md](docs/CASESTUDY.md) · build spec:
[docs/SPEC.md](docs/SPEC.md) · plan: [docs/PLAN.md](docs/PLAN.md).

---

## Stack

| Area | Tech |
|---|---|
| Agents | **Google ADK** (`google-adk`) — Sequential / Parallel / Loop / Coordinator / Agent-as-Tool |
| Reasoning | **Vertex AI — Gemini 3.5 Flash** (incl. multimodal BOM parsing) + Google Search grounding |
| Backend | **FastAPI** (serves the API *and* the built SPA) |
| Frontend | **React + Vite + TypeScript + Tailwind** |
| Auth | **Firebase Authentication** (email + Google) |
| Data | **Cloud Firestore** (named db `sourcingsentinel`) |
| Host | **Cloud Run** (single service, asia-northeast1) via **Cloud Build** + **Artifact Registry** |

## Repository layout

```
sourcing_sentinel/   ADK agent package (agents/, tools/, schemas, config) + root_agent
backend/             FastAPI: main.py, runner.py (ADK Runner), auth.py, store.py
frontend/            React + Vite SPA (auth, business profile, risk dashboard)
data/                Seed BOM + scripted demo trigger
Dockerfile           Multi-stage: build SPA -> Python serves API + static
deploy.sh            One-command Cloud Run deploy (Tokyo)
docs/                ARCHITECTURE, SPEC, CASESTUDY, PLAN, GOALS_1..4
```

---

## Run locally

### 1. Agent pipeline (Python)

```bash
python -m venv .venv && source .venv/bin/activate   # repo uses .venv (Python 3.12+)
pip install -r requirements.txt
gcloud auth application-default login                 # ADC for Vertex
# .env already set: GOOGLE_GENAI_USE_VERTEXAI=TRUE, project, GOOGLE_CLOUD_LOCATION=asia-northeast1

.venv/bin/python -m sourcing_sentinel.tests.test_pipeline   # full pipeline, real Gemini
.venv/bin/adk web sourcing_sentinel                          # ADK playground UI
```

### 2. Backend API

```bash
.venv/bin/uvicorn backend.main:app --port 8000 --reload
# GET /api/healthz, POST /api/analyze, POST /api/upload-bom
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Firebase setup (one-time) and the auth/Firestore flow are documented in
[frontend/README.md](frontend/README.md). `frontend/.env` `VITE_API_BASE` controls the
backend target:

- empty → built-in mock (no backend)
- `http://localhost:8000/api` → local backend
- the deployed `…run.app/api` → deployed backend (current default)

---

## Deploy (one Cloud Run service, Tokyo)

```bash
./deploy.sh          # gcloud run deploy --source . --region asia-northeast1
```

Prereqs: APIs enabled (`run`, `aiplatform`, `cloudbuild`, `artifactregistry`); the runtime
service account granted `roles/aiplatform.user` + `roles/datastore.user`; and the
`*.run.app` domain added to Firebase **Authorized domains**. The Dockerfile builds the SPA
with `VITE_API_BASE=/api` so the deployed app is same-origin.

---

## Live vs. stubbed data

`USE_STUBS` (env) controls the external data tools:

| Stream | `USE_STUBS=true` (demo default) | `USE_STUBS=false` (live) |
|---|---|---|
| FX | canned USD/JPY +3% | **frankfurter.app** (live, no key) |
| Weather | canned typhoon near Kagoshima | **Open-Meteo** (live, no key) |
| Commodity | canned titanium +8% | Google Search grounding |
| Suppliers | 2 canned alternates | Google Search grounding + curated fallback |
| News | — | **Google Search** grounding (always live) |
| BOM parsing | returns `data/sample_bom.json` | **Gemini multimodal** on the uploaded file |

The deployed service runs with `USE_STUBS=true` for a deterministic 2-minute demo (the
Tanaka Seiko / titanium-bolt scenario). Set `USE_STUBS=false` to use live signals.

## Demo flow

Sign up → **Business profile** → *Load sample BOM* (or upload a file) → **Save** →
**Dashboard → Run analysis** → see impacted parts + ¥ exposure, a feasibility-checked
plan, and JP keigo + English draft emails. Each run is saved under `users/{uid}/runs`.
