# Architecture

## What this repo is

This is a Next.js App Router application with two product areas:

- Contest app: active feature set for contest creation, judging, scoring, and display mode
- DC calculator: legacy calculator preserved inside the same shell

The contest app is the active area. The DC calculator is intentionally stable and should only receive targeted changes.

## Route structure

- `/`: contest landing page
- `/contest/[id]`: live contest page
- `/contest/[id]/display`: display mode
- `/account`: account/session
- `/admin`: admin dashboard
- `/admin/contest-setup`: create contest
- `/onboard`: guest/Google onboarding
- `/dc-calculator`: legacy calculator

Route groups:

- `app/(contest)/`: contest layouts and pages
- `app/(dc-calculator)/`: legacy calculator layout and page

## Provider and shell structure

Root layout:

1. `app/layout.tsx`
2. `app/RootLayoutClient.tsx`
3. `SiteHeader`
4. route children

Active global providers:

- `AuthProvider`
- `ContestProvider`

Contest routes load contest feature SCSS through `app/(contest)/layout.tsx`.

## Contest data path

Current live path:

1. client hooks/components call `src/features/contest/lib/api/*`
2. the client API layer uses the browser Firebase-backed provider
3. provider modules talk to Firestore directly with the signed-in browser session

Separate HTTP path:

1. `app/api/contest/*` route handlers expose contest endpoints
2. those handlers share request/response/admin helpers
3. `app/api/contest/openapi.json` documents that contract

Direct Firebase usage in the client should stay limited to:

- the `lib/api/*` client layer
- authentication
- live Firestore subscriptions

Do not describe the route handlers as the canonical runtime CRUD path until a true server-side provider exists behind them.

## Current vs target approach

Current approach:

- The browser app is API-first: all data access flows through REST routes under `/api/contest/`.
- React code calls `contestApi` and `adminApi`, which use `fetchWithAuth` to call the REST API with Firebase Bearer tokens.
- API routes use the `BackendProvider` interface server-side; the client never touches Firestore directly for data operations.
- The only client-side Firestore usage is `onSnapshot` for real-time contest subscriptions (read-only).
- Firebase Auth (client SDK) handles login/register/tokens; the Admin SDK verifies tokens server-side.

Why the client/server confusion keeps happening:

- OpenAPI is just a contract for HTTP endpoints; it is not a requirement that the browser app must go through those endpoints.
- The browser already has a real auth context for Firestore.
- A Next route handler needs a different auth story: verify the Firebase ID token, use a server-side provider, and enforce permissions on the server.
- Mixing these two approaches halfway creates regressions: the browser thinks it is authenticated, but the server route may still hit Firestore without an equivalent server-side identity/permission model.

Recommended target:

- Keep the main contest app intentionally simple.
- Treat the browser Firebase-backed client as the default CRUD path for contest, entry, and vote flows.
- Treat `app/api/contest/*` as an integration/documentation surface unless and until we do a full migration to a real server-side backend.
- If we ever move the browser app to HTTP, do it end-to-end:
  1. browser sends Firebase ID token
  2. route handler verifies token
  3. route handler uses a server-side provider
  4. server enforces auth/admin rules explicitly
- Do not split one feature across both runtime paths.

Short version:

- Simple now: browser client + Firestore rules
- Optional later: full server API migration
- Avoid: hybrid half-migration

## Voting and aggregation model

Current implementation:

- Contest entries live on the contest document in `entries[]`.
- Individual votes live in `contests/{contestId}/votes/{userId}_{entryId}`.
- Each vote stores the full per-attribute `breakdown`.
- Each entry caches aggregate fields on the contest doc:
  - `sumScore`
  - `voteCount`

Write algorithm:

1. Read the existing vote doc for `{userId}_{entryId}`.
2. Compute the old total and new total from the breakdown.
3. Calculate `delta = newTotal - oldTotal`.
4. Upsert the vote doc in the votes subcollection.
5. Update the matching entry aggregate in the contest doc inside the same Firestore transaction.
6. Increment `voteCount` only when this is a brand-new vote.

Why this is the right shape for this app:

- Scoreboards and brackets read precomputed aggregates from the contest doc.
- The UI does not need an N-query recount across all votes just to show standings.
- Re-votes are naturally handled by the deterministic vote document ID and delta update.
- Per-user ballot state can still be read by querying votes for that user when needed.

What should stay true:

- Reading aggregate standings should not require scanning all votes.
- Re-voting should be an update to one stable vote document, not a second vote row.
- The aggregation logic should live in exactly one write path.

## Contest feature layout

- `src/features/contest/components/`: UI grouped by area
- `src/features/contest/contexts/`: React state providers
- `src/features/contest/lib/backend/`: provider contracts and provider factory
- `src/features/contest/lib/domain/`: pure contest logic and validation
- `src/features/contest/lib/presentation/`: UI-facing derived models and mapping helpers
- `src/features/contest/lib/firebase/`: Firebase provider implementations and Firestore access
- `src/features/contest/lib/hooks/`: contest-specific hooks
- `src/features/contest/styles/`: contest style system and feature styles

## Style layering

- `app/globals.scss`: app-wide global entry point
- `src/styles/`: shared cross-feature style building blocks
- `src/features/contest/styles/`: contest-specific tokens, mixins, and feature styles
- `src/features/dc-calculator/assets/`: legacy calculator style forwards

## Key constraints

- Keep public route shapes stable while internals move.
- Keep `@/contest/*` as the stable import surface.
- Prefer moving guidance closer to code instead of growing top-level note files.
