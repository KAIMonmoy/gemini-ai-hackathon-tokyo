# Sourcing Sentinel — Frontend (Phase 2)

React + Vite + TypeScript SPA with Tailwind, Firebase Auth, and Firestore.
In Phase 2 it runs against a **mock** analysis client (no backend); Phase 4 swaps in
the real backend by setting `VITE_API_BASE`.

## One-time Firebase setup (console)

The app needs a Firebase Web app in the existing GCP project
`tokyo-gemini-ai-hackathon`. Do this once in the browser:

1. Go to https://console.firebase.google.com → **Add project** → choose the existing
   Google Cloud project **tokyo-gemini-ai-hackathon** (don't create a new one).
2. **Build → Authentication → Get started** → enable **Email/Password** and **Google**.
3. **Build → Firestore Database → Create database** → Production mode → region
   `asia-northeast1` (Tokyo, matches the agent).
4. **Project settings (⚙) → General → Your apps → Web (`</>`)** → register an app →
   copy the `firebaseConfig` values.
5. Paste them into `frontend/.env` (`VITE_FIREBASE_*`). See `.env.example`.

Deploy the security rules (from repo root, needs the Firebase CLI):

```bash
npm i -g firebase-tools   # or: npx firebase-tools ...
firebase deploy --only firestore:rules --project tokyo-gemini-ai-hackathon
```

(You can also paste `firestore.rules` into the console under Firestore → Rules.)

## Run

```bash
cd frontend
npm install        # first time only
npm run dev        # http://localhost:5173
```

Then: **Sign up → Business profile → Load sample BOM → Save → Dashboard → Run analysis.**
With `VITE_API_BASE` empty you'll get the mock brief; the run is saved to Firestore
under `users/{uid}/runs`.

## Build

```bash
npm run build      # tsc typecheck + production bundle into dist/
```

## Layout

- `src/lib/firebase.ts` — Firebase init · `src/lib/types.ts` — shapes mirroring the agent
- `src/lib/store.ts` — Firestore read/write (`users/{uid}` profile + `runs` subcollection)
- `src/auth/` — `AuthContext` + `RequireAuth` route guard
- `src/api/client.ts` — `runAnalysis` (mock now, real backend in Phase 4) + `mockBrief.ts`
- `src/pages/` — `Login`, `Signup`, `Profile`, `Dashboard`
- `src/components/` — `Layout` (nav) + `ui.tsx` (Tailwind primitives)
