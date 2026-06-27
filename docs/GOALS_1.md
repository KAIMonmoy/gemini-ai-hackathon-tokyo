# Phase 1 Goals — Agent Core with Stubs

> **Objective:** Prove the multi-agent idea works end-to-end, fully offline, before any UI,
> backend, or cloud infrastructure exists. If the agent loop produces a sensible risk brief from
> seed data, the core concept is validated.

## Goals

- [ ] The `sourcing_sentinel/` ADK package exists and imports cleanly (`import sourcing_sentinel`).
- [ ] `config.py` exposes `MODEL=gemini-3.5-flash` and a `USE_STUBS` flag; `schemas.py` defines the
      State Contract types from `SPEC.md` §7.
- [ ] All five tools return deterministic, schema-correct stub data when `USE_STUBS=true` (no network).
- [ ] The full pipeline runs as one `SequentialAgent`: intake → parallel sensing → impact →
      response (loop + coordinator) → comms.
- [ ] The plan/critique loop demonstrably rejects an infeasible alternate at least once, then
      converges to a feasible plan.
- [ ] The run ends in a decision-ready brief: impacted parts, ¥ exposure, ranked mitigation, and
      draft emails in both JP keigo and EN.

## Definition of done

- `.venv/bin/python -m sourcing_sentinel.tests.test_pipeline` passes **offline** with `USE_STUBS=true`.
- The test asserts the full chain: `watch_list` → 4 distinct `*_risk` keys → `impact` (titanium bolt
  flagged) → `response_plan` (non-empty `chosen`) → ≥1 JP email + ≥1 EN email.
- The pipeline is inspectable via `adk run`/`adk web` and tells the Tanaka Seiko demo story (§14).

## Out of scope (this phase)

- No real external API calls, no Gemini calls required to pass the test (stubs only).
- No UI, no auth, no Firestore, no FastAPI, no deployment.
