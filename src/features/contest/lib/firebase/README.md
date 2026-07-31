# Firebase Layer

This folder owns Firebase-specific implementation details for the contest app.

## Responsibilities

- initialize Firebase clients
- implement backend provider contracts
- talk to Firestore
- normalize Firebase-specific data shapes

## Layout

- `firestoreAdapter/` — client-SDK Firestore adapter, split per resource (contests, configs, scores, vote submission, contestant cascade, matchups, profiles); `index.ts` exposes the `FirestoreAdapter` contract and factory.
- `firestoreAdminAdapter/` — Admin-SDK mirror of the same per-resource modules, used by API routes.
- `collection-names.ts`, `matchup-doc.ts`, `scoreHelpers.ts` — Firestore collection names and doc-mapping shared by both adapters.
- `firebaseAuthProvider.ts` — client auth provider (wraps the Firebase Auth SDK; no Firestore), backed by `signInFlows.ts`, `guestUpgradeFlows.ts`, `authProfileSync.ts`, and the shared session user in `authSessionUser.ts`.

## Rules

- Keep Firebase details out of presentation helpers and most components.
- Route handlers and the backend provider are the CRUD boundary.
- Client-side Firebase usage outside this folder should be limited to auth and live subscriptions.
