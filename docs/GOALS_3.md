# Phase 3 Goals — Backend, Real AI Logic, GCP Deploy

> **Objective:** Stand up the real FastAPI backend that wraps the Phase 1 agent pipeline, switch the
> data tools from stubs to live sources, and deploy everything to Google Cloud so the system runs in
> the real world behind authenticated requests.

## Goals

- [ ] FastAPI backend that **verifies Firebase ID tokens** and resolves the calling `uid`.
- [ ] Backend reads the user's watch list from Firestore and writes analysis results back under
      `users/{uid}/runs`.
- [ ] An ADK `Runner` wraps `root_agent`: injects `watch_list` into session state, runs the pipeline
      to completion, and returns the final brief.
- [ ] Endpoints: `POST /analyze`, `POST /upload-bom` (multimodal intake), `GET /healthz`, with CORS.
- [ ] `USE_STUBS=false`: live `get_fx` (frankfurter.app) and `get_weather_logistics` (Open-Meteo);
      commodity/suppliers on `google_search` + curated fallback. Every network call has a safe
      fallback and never crashes the pipeline.
- [ ] Gemini runs on the **Vertex path** with `gemini-3.5-flash`; ADC + required GCP APIs enabled.
- [ ] Whole app deployed to **Cloud Run** in **`asia-northeast1` (Tokyo)** (core requirement): the
      FastAPI service serves both the API and the built SPA as static files — **one Cloud Run service,
      one public URL**. No Firebase Hosting. All resources (Cloud Run, Vertex, Firestore) stay in
      asia-northeast1.

## Definition of done

- A request to the deployed `POST /analyze` with a valid Firebase token returns a brief computed
  from **live** FX/weather, and the run document appears in Firestore.
- The single Cloud Run service has a reachable public URL that serves both the SPA and the API.

## Out of scope (this phase)

- Full UI↔backend wiring and the BOM-upload user flow (that's Phase 4).
- Continuous/scheduled monitoring (future roadmap, `SPEC.md` §15 / `CASESTUDY.md` §8).
