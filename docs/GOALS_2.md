# Phase 2 Goals — Frontend, Auth, Firestore

> **Objective:** Give a user a real, usable web app — sign up, describe their business, and view a
> risk brief — built against a **mocked** backend so UI progress isn't blocked on the real agent
> backend (Phase 3).

## Goals

- [ ] Firebase project configured with **Authentication** (Email/Password + Google) and **Firestore**.
- [ ] A React + Vite + TypeScript SPA scaffolded with routing and Firebase initialized.
- [ ] Users can **sign up and log in**; protected routes redirect unauthenticated users.
- [ ] A **business profile** page captures the company and its BOM watch list (matching the
      `WatchListItem` shape) and persists it to Firestore.
- [ ] A **dashboard** page renders a risk brief — impacted parts, ¥ exposure, risk score, ranked
      alternatives, and draft JP/EN emails — fed by a mock API client.
- [ ] Firestore data model with security rules scoping each user to their own `users/{uid}/**`:
      a `users/{uid}` profile doc holding company info + the watch-list `items` array, and a
      `users/{uid}/runs` subcollection of analysis results. (The watch list lives as an array in
      the profile doc rather than a separate `watchlist` subcollection — simpler and atomic for a
      small list.)

## Definition of done

- `npm run dev` → a new user can sign up, create a business profile (visible in the Firestore
  console), and see the mocked risk brief render end-to-end in the browser.
- The mock client returns the **exact shape** the real agent will produce, so swapping it in Phase 4
  requires no UI changes.

## Out of scope (this phase)

- No real agent runs (dashboard data is mocked).
- No FastAPI backend yet, no real BOM parsing, no deployment.
