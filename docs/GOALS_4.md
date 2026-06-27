# Phase 4 Goals — Wire Everything Together (End-to-End)

> **Objective:** Connect the deployed frontend, backend, and agent pipeline into one working
> product, and make the demo reproducible. This is the "definition of done" for the whole project.

## Goals

- [ ] Frontend points at the deployed Cloud Run backend; the mock API client is removed.
- [ ] Real end-to-end flow works with real auth tokens and real Firestore data:
      signup → business profile → **BOM upload** → multimodal `parse_documents` (real Gemini) →
      watch list saved → "Run analysis" → real pipeline → dashboard shows the real brief + emails.
- [ ] Analysis results persist under `users/{uid}/runs` and are viewable in the dashboard.
- [ ] The `SPEC.md` §14 demo scenario reproduces **deterministically** from seed data for a clean
      2-minute demo.
- [ ] `README.md` documents setup, local run, deploy, and which streams are live vs stubbed.

## Definition of done

- On the public deployed URL: a new user can sign up, create a profile, upload a BOM, and receive a
  risk brief with ¥ exposure, feasibility-checked alternates, and JP keigo + EN emails.
- The Tanaka Seiko / titanium-bolt demo scenario reproduces from seed data on demand.

## Out of scope (this phase)

- Roadmap items: scheduled background monitoring, push alerts, tier-2 supplier mapping, verified
  supplier network, sector templates (`CASESTUDY.md` §8).
