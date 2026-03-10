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

The intended long-term boundary is:

1. client hooks/components call `src/features/contest/lib/api/*`
2. API clients call `app/api/contest/*`
3. route handlers resolve a backend provider
4. the backend provider talks to Firebase/Firestore

Direct Firebase usage in the client is reserved for:

- authentication
- live Firestore subscriptions

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
