# Sourcing Sentinel — Architecture

> An always-on, multi-agent supply-chain risk radar for small Japanese manufacturers.
> Built entirely on the Google Cloud / Gemini agentic stack and deployed as a single
> **Cloud Run** service in **Tokyo (asia-northeast1)**.

**Live:** https://sourcing-sentinel-h3rjzaz5ca-an.a.run.app

---

## 1. System architecture (the big picture)

```mermaid
flowchart TB
    subgraph Client["👤 Browser — React + Vite SPA (Tailwind)"]
      UI["Signup / Login · Business profile · Risk dashboard"]
    end

    subgraph CR["☁️ Cloud Run — single service · asia-northeast1"]
      direction TB
      FAPI["FastAPI<br/>• serves the built SPA (static)<br/>• /api/analyze · /api/upload-bom · /api/healthz"]
      ADK["Google ADK runtime<br/>root_agent + analysis pipeline"]
      FAPI --> ADK
    end

    subgraph Google["🔶 Google Cloud / Gemini"]
      VERTEX["Vertex AI — Gemini 3.5 Flash<br/>(reasoning + multimodal)"]
      SEARCH["Google Search grounding"]
      FBAUTH["Firebase Authentication"]
      FS["Cloud Firestore<br/>(db: sourcingsentinel)"]
    end

    EXT["🌐 Free public data<br/>frankfurter.app (FX) · Open-Meteo (weather)"]

    UI -- "HTTPS + Firebase ID token" --> FAPI
    UI -- "auth" --> FBAUTH
    FAPI -- "verify ID token" --> FBAUTH
    FAPI -- "read profile / write runs" --> FS
    ADK -- "every agent step" --> VERTEX
    ADK -- "news / commodity / suppliers" --> SEARCH
    ADK -- "live signals" --> EXT
```

**Why one Cloud Run service?** The FastAPI backend serves *both* the API and the
pre-built SPA (static files with SPA fallback), so the entire product ships behind a
single public URL — satisfying the hackathon's "deployed on Google Cloud" requirement
with one artifact, one origin (no CORS in prod), and co-located with Vertex + Firestore
in Tokyo for low latency and data residency.

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind | Signup, business/BOM profile, risk dashboard |
| Edge / host | **Cloud Run** (1 service, asia-northeast1) | Serves SPA + API; autoscaling, public URL |
| API | FastAPI (Python) | Auth, Firestore I/O, runs the agent pipeline |
| Agents | **Google ADK** (`google-adk`) | Orchestrates the multi-agent pipeline |
| Reasoning | **Vertex AI — Gemini 3.5 Flash** | Every agent's brain + multimodal doc parsing |
| Auth | **Firebase Authentication** | Email/password + Google sign-in |
| Data | **Cloud Firestore** (named db `sourcingsentinel`) | Per-user profile + analysis history |
| Build/ship | **Cloud Build** + **Artifact Registry** | Container build + image registry |

---

## 2. Google products used (judging: Google Cloud integration)

```mermaid
mindmap
  root((Sourcing<br/>Sentinel))
    Vertex AI
      Gemini 3.5 Flash
      Multimodal BOM parsing
    Agent Development Kit
      Sequential / Parallel / Loop
      Coordinator + Agent-as-Tool
    Google Search grounding
      News · commodity · suppliers
    Cloud Run
      Single service · Tokyo
      SPA + API
    Cloud Build + Artifact Registry
      Container build & registry
    Firebase Auth
      Email + Google
    Cloud Firestore
      Profiles + run history
```

| Google product | How Sourcing Sentinel uses it |
|---|---|
| **Vertex AI (Gemini 3.5 Flash)** | The reasoning engine for *all* agents, and the multimodal model that reads messy BOM/invoice files (PDF, Excel, photo) into a structured watch list. Runs in `asia-northeast1`. |
| **Agent Development Kit (ADK)** | Defines the agents and wires the five orchestration patterns (Sequential, Parallel, Loop, Coordinator, Agent-as-Tool). Provides the `Runner`, session state, and tool calling. |
| **Google Search grounding** | Built-in ADK tool used by the news agent (and available to commodity/supplier discovery) for live, grounded signals instead of hallucinated ones. |
| **Cloud Run** | Hosts the entire app as one autoscaling service with a public HTTPS URL. |
| **Cloud Build + Artifact Registry** | `gcloud run deploy --source .` builds the multi-stage Docker image and stores it. |
| **Firebase Authentication** | Owner sign-up / sign-in (email + Google); the backend verifies the Firebase ID token on every API call. |
| **Cloud Firestore** | Stores each owner's business profile + BOM watch list and a history of analysis runs, in the named `sourcingsentinel` database (Tokyo). |

---

## 3. Core agent architecture (the heart of the system)

A **Sequential** mission pipeline is the spine. Stage 2 fans out in **Parallel**.
Stage 4 is a **Coordinator** that drives a **Loop-Review** and specialists exposed as
**Agent-as-Tools**. All five canonical multi-agent patterns appear.

```mermaid
flowchart TD
    IN([BOM + invoices · or saved watch list])

    subgraph ROOT["root_agent — SequentialAgent (mission pipeline)"]
      direction TB
      A1["① doc_intake_agent<br/><i>Gemini multimodal → watch_list</i>"]

      subgraph SENSE["② sensing_team — ParallelAgent (concurrent)"]
        direction LR
        N["news_agent<br/><i>google_search</i>"]
        W["weather_agent<br/><i>Open-Meteo</i>"]
        C["commodity_agent<br/><i>prices</i>"]
        F["fx_agent<br/><i>frankfurter</i>"]
      end

      A3["③ impact_agent<br/><i>fuse signals → ¥ exposure, risk</i>"]

      subgraph RESP["④ response_coordinator — Coordinator (Agent-as-Tool)"]
        direction TB
        COORD{"choose: re-source / hedge / renegotiate"}
        subgraph LOOP["mitigation_loop — LoopAgent (≤3)"]
          direction LR
          PL["sourcing_planner"] -->|plan| CR2["feasibility_critic"]
          CR2 -->|"fail → revise"| PL
          CR2 -->|"pass → exit_loop"| OUT2(( ))
        end
        HS["hedge_specialist"]
        RS["renegotiation_specialist"]
        COORD --> LOOP
        COORD --> HS
        COORD --> RS
      end

      A5["⑤ comms_agent<br/><i>keigo (JP) + English emails</i>"]

      A1 --> SENSE --> A3 --> RESP --> A5
    end

    IN --> A1
    A5 --> OUT([Decision brief: impact · ranked plan · ready-to-send emails])
```

### Agent roster

| # | Agent | ADK type | Reads (state) | Writes `output_key` | Tools |
|---|---|---|---|---|---|
| 1 | `doc_intake_agent` | LlmAgent | user message / files | `watch_list` | `parse_documents` (Gemini multimodal) |
| 2 | `news_agent` | LlmAgent | `watch_list` | `news_risk` | `google_search` |
| 2 | `weather_agent` | LlmAgent | `watch_list` | `weather_risk` | `get_weather_logistics` (Open-Meteo) |
| 2 | `commodity_agent` | LlmAgent | `watch_list` | `commodity_risk` | `get_commodity_prices` |
| 2 | `fx_agent` | LlmAgent | `watch_list` | `fx_risk` | `get_fx` (frankfurter.app) |
| 2 | `sensing_team` | **ParallelAgent** | — | — | runs the 4 above concurrently |
| 3 | `impact_agent` | LlmAgent | `watch_list` + 4×`*_risk` | `impact` | — |
| 4 | `sourcing_planner` | LlmAgent | `impact`, `feasibility?` | `sourcing_plan` | `find_alternate_suppliers` |
| 4 | `feasibility_critic` | LlmAgent | `sourcing_plan`, `impact` | `feasibility` | `exit_loop` |
| 4 | `mitigation_loop` | **LoopAgent** (≤3) | — | — | planner ⇄ critic |
| 4 | `hedge_specialist` | LlmAgent | `impact` | `hedge_plan` | — |
| 4 | `renegotiation_specialist` | LlmAgent | `impact` | `reneg_plan` | — |
| 4 | `response_coordinator` | **LlmAgent (Coordinator)** | `impact` | `response_plan` | `AgentTool`(loop, hedge, reneg) |
| 5 | `comms_agent` | LlmAgent | `impact`, `response_plan` | final emails | — |

### The five agent patterns (one slide)

| Pattern | Where | Why it matters |
|---|---|---|
| **Sequential** | `root_agent` | Each stage depends on the previous one's state. |
| **Parallel** | `sensing_team` | 4 independent risk streams run at once — faster, isolated context. |
| **Loop-Review** | `mitigation_loop` | Planner proposes, critic rejects infeasible alternates, repeat until feasible. |
| **Coordinator** | `response_coordinator` | The situation decides the response: re-source, hedge, or renegotiate. |
| **Agent-as-Tool** | specialists via `AgentTool` | Coordinator stays in control instead of blindly transferring. |

> **Demo proof point:** in a live run, the critic rejected a 45-day alternate and the
> loop converged on a 12-day one — visible, self-correcting agent behavior, not a single prompt.

---

## 4. Request lifecycle — "Run analysis"

```mermaid
sequenceDiagram
    participant U as Browser (SPA)
    participant F as FastAPI (Cloud Run)
    participant FB as Firebase Auth
    participant DB as Firestore
    participant AG as ADK analysis pipeline
    participant GM as Vertex AI · Gemini 3.5 Flash

    U->>F: POST /api/analyze (Bearer ID token)
    F->>FB: verify ID token → uid
    F->>DB: load users/{uid} → watch_list
    F->>AG: run_analysis(watch_list)
    Note over AG,GM: sensing (parallel) → impact → response (loop) → comms
    AG->>GM: many grounded reasoning calls
    GM-->>AG: signals · impact · plan · emails
    AG-->>F: decision brief
    F->>DB: save users/{uid}/runs/{id}
    F-->>U: brief (impact, plan, JP+EN emails)
```

**Note on intake vs. analysis:** the full `root_agent` (with `doc_intake_agent`) powers
`adk run`/`adk web` and the BOM-upload flow. For `/api/analyze`, the backend runs an
**analysis pipeline** (sensing → impact → response → comms) and injects the user's saved
`watch_list` straight into session state — no need to re-parse documents every run.

---

## 5. Data model (Firestore — `sourcingsentinel`)

```
users/{uid}                     ← business profile
  ├─ company_name, contact_*, currency_home
  └─ items: [ WatchListItem … ] ← the BOM watch list
users/{uid}/runs/{runId}        ← one analysis result (Brief)
  ├─ impact { items[], overall_risk, summary }
  ├─ response_plan { priority_actions[], chosen[], summary }
  └─ emails [ { to, lang: JP|EN, subject, body } ]
```

Security rules scope every user to their own `users/{uid}/**` — no cross-user access.

### State Contract (how agents pass data)

`watch_list` → `news_risk` · `weather_risk` · `commodity_risk` · `fx_risk` → `impact`
→ (`sourcing_plan` · `feasibility` · `hedge_plan` · `reneg_plan`) → `response_plan` →
emails. Each agent reads/writes only these `session.state` keys.

---

## 6. Deployment topology

```mermaid
flowchart LR
    DEV["gcloud run deploy --source ."] --> CB["Cloud Build<br/>multi-stage Docker"]
    CB --> AR["Artifact Registry"]
    AR --> CRUN["Cloud Run service<br/>sourcing-sentinel · asia-northeast1"]
    CRUN --> URLN(["Public HTTPS URL"])
```

- **Multi-stage image:** Node stage builds the SPA (`VITE_API_BASE=/api`) → Python stage
  serves API + static via Uvicorn.
- **Region:** everything (Cloud Run, Vertex, Firestore) in **asia-northeast1**.
- **Config:** `USE_STUBS=true` for a deterministic demo; flip to `false` for live
  FX/weather/search. Model pinned to `gemini-3.5-flash`.

---

## 7. Pitch-deck talking points

- **Real problem, local fit:** 99.7% of Japanese firms are SMEs; single-sourced,
  yen-exposed, no risk desk. We give them one — as a team of AI agents.
- **Multimodal in, action out:** upload messy BOM/invoices → get ¥-quantified risk,
  a feasibility-checked plan, and ready-to-send **keigo + English** emails.
- **Genuinely agentic:** five ADK patterns, parallel sensing, and a self-correcting
  plan⇄critique loop — orchestration, not a single prompt.
- **All-Google, all-Tokyo:** Gemini 3.5 Flash + ADK + Cloud Run + Firebase + Firestore,
  one service, one region, one public URL.
