# CLAUDE.md

## Commands

- `npm run dev` -- Start Firebase emulators (Auth + Firestore), seed test accounts, and run `next dev` — one orchestrated process tree (see [Local Firebase Emulators](#local-firebase-emulators) below)
- `npm run dev:prod` -- Start dev server against cloud Firebase via `.env.production` (no emulators)
- `npm run build` -- Production build
- `npm run lint` -- ESLint with zero warnings allowed (`--max-warnings=0`)
- `npm run type-check` -- TypeScript type checking (`tsc --noEmit`)
- `npm test` -- Run all unit tests once (vitest)
- `npm run test:watch` -- Run unit tests in watch mode
- `npm run test:e2e` -- Run Playwright E2E suite (reuses the same orchestrator as `npm run dev`; see `e2e/README.md`)
- `npm run test:e2e:ui` -- Playwright UI mode for authoring/debugging specs
- `npm run test:e2e:install` -- One-time: install the chromium binary
- `npm run emulators` -- Start emulators only (advanced: when you want them detached from the dev server)
- `npm run emulators:seed` -- Re-seed test accounts into already-running emulators
- `npm run docs:validate` -- Validate OpenAPI spec at `app/api/contest/openapi.json`

## Local Firebase Emulators

`npm run dev` orchestrates everything in a single process tree (`scripts/dev.mjs`):

1. Spawns the Firebase emulators (Auth on `127.0.0.1:9099`, Firestore on `127.0.0.1:8080`, Emulator UI on `http://127.0.0.1:4000`).
2. Waits for both TCP endpoints to listen.
3. Runs `scripts/seed-emulator.mjs` (idempotent — safe across restarts).
4. Spawns `next dev` with `.env.emulators` injected so the client + Admin SDK both point at the emulators.

Ctrl+C tears the whole tree down together.

**Prerequisite:** the Firebase emulators require Java (the `firebase-tools` CLI shells out to it).

**Surfaces emulated:** Auth (email/password, Google OAuth, anonymous) and Firestore. Storage, Functions, and Realtime DB are not used by the app, so they are intentionally not emulated.

### Test / AI accounts

These accounts are seeded by `scripts/seed-emulator.mjs` on every `npm run dev`. AI agents and humans use them to validate flows end-to-end against the local stack — no production credentials needed.

| Role  | Email              | Password   | Notes                                  |
| ----- | ------------------ | ---------- | -------------------------------------- |
| Admin | `admin@test.com`   | `admin123` | role: admin (custom claim + Firestore) |
| Voter | `voter@test.com`   | `voter123` | role: voter                            |
| Voter | `voter1@test.com`  | `voter123` | role: voter (used by E2E specs)        |
| Voter | `voter2@test.com`  | `voter123` | role: voter (used by E2E specs)        |
| Voter | `voter3@test.com`  | `voter123` | role: voter (used by E2E specs)        |

Anonymous "Continue as Guest" sign-in is also wired up (creates an anonymous Firebase user with role=voter).

**Notes:**
- Emulator data is ephemeral — it resets when the emulators restart. The seed script re-runs automatically on each `npm run dev`, so the accounts above are always present.
- Open `http://127.0.0.1:4000` (Emulator UI) to inspect Auth users and Firestore documents while the app is running.
- If a startup fails with "port in use," kill stray `node`/`java`/`next` processes on 3000/4000/8080/9099 and retry.

## Tech Stack

- Next.js 16 (App Router) with React 19 and TypeScript (strict mode)
- React Compiler enabled (`reactCompiler: true` in next.config.mjs)
- MUI v6 + Emotion for component library / styling
- SCSS Modules for custom styles (Sass)
- Firebase (client SDK) + Firebase Admin for backend/auth
- Vitest + jsdom + Testing Library for tests
- Flat ESLint config (eslint.config.js) with typescript-eslint and @next/next plugin

## Project Structure

```
app/                          # Next.js App Router pages and API routes
  (contest)/                  # Route group: contest UI pages
    admin/                    # Admin dashboard and contest setup
    contest/[id]/             # Contest detail + display pages
    account/                  # Account page
    onboard/                  # Onboarding
  (dc-calculator)/            # Route group: legacy DC calculator
  api/contest/                # REST API routes (see below)
  layout.tsx                  # Root layout (server component)
  RootLayoutClient.tsx        # Client-side root wrapper
  page.tsx                    # Home page (server component)

src/
  components/                 # Shared components (barrel exports via index.ts)
    layout/                   # NavBar, SiteHeader
    ui/                       # ConfirmDialog, AdminOnlyLink, etc.
  features/contest/           # Contest feature module
    components/               # UI components organized by domain
      admin/                  # Admin panel components
      auth/                   # Auth modal, login/register forms
      home/                   # Landing page components
      ui/                     # Vote, bracket, entry display
      votePage/               # Vote page-specific components
    contexts/                 # React contexts
      auth/                   # Auth state (reducer + provider pattern)
      contest/                # Contest state + hooks
    lib/
      api/                    # Client-side API helpers, server auth
      backend/                # Backend provider abstraction (types, factory)
      domain/                 # Pure business logic (scoring, validation, phases)
      firebase/               # Firebase implementation of backend providers
      hooks/                  # Shared custom hooks
      presentation/           # UI mapping and display model logic
    styles/                   # SCSS partials organized by domain
```

## Path Aliases

Defined in tsconfig.json (mirrored in vitest.config.ts):

- `@/*` -- project root (`./`)
- `@/components/*` -- `./src/components/*`
- `@/features/*` -- `./src/features/*`
- `@/contest/*` -- `./src/features/contest/*`

Import restriction: `@/src/*` imports are banned by ESLint. Use the aliases above instead.

## Key Conventions

### Components

- Server components by default; client components use `'use client'` directive.
- Pages are async server components (e.g., `page.tsx` uses `await getCurrentUser()`).
- Route groups `(contest)` and `(dc-calculator)` separate layout concerns.
- SCSS Modules for page/component styles (e.g., `page.module.scss`, `ContestList.module.scss`).
- Shared components use barrel exports (`src/components/index.ts`).

### API Routes

- Located under `app/api/contest/` following Next.js route handler conventions.
- Shared utilities in `app/api/contest/_lib/`: `http.ts` (json helpers), `provider.ts` (backend access), `requireAdmin.ts` (auth guard).
- Routes use `jsonSuccess()` / `jsonError()` / `fromProviderResult()` helpers from `_lib/http.ts`.
- Backend access goes through `loadProvider()` which returns a `BackendProvider` interface -- routes never touch Firebase directly.
- Admin-only endpoints call `requireAdmin(request)` which returns a Response on failure or null on success.
- OpenAPI spec at `app/api/contest/openapi.json` with Scalar docs served at `/api/contest/docs`.

### Backend Architecture

- Provider pattern: `BackendProvider` interface in `src/features/contest/lib/backend/types.ts` abstracts all data access.
- `ProviderResult<T>` is the standard return type: `{ success: boolean; data?: T; error?: string }`.
- Firebase is the concrete implementation (`src/features/contest/lib/firebase/`).

### Testing

Two tiers:

**Unit (`npm test`)** — Vitest + jsdom, in-process.
- Tests live next to source files as `*.test.ts` / `*.test.tsx`.
- API route tests mock `loadProvider` and `requireAdmin` via `vi.mock()`, then call route handlers directly.
- Domain logic tests are pure unit tests with no mocking needed.

**E2E (`npm run test:e2e`)** — Playwright + real Firebase emulator + real browser.
- Specs under `e2e/specs/`. Fixtures under `e2e/fixtures/`. See `e2e/README.md` for run instructions and trace viewer usage.
- `scripts/dev.mjs` orchestrates emulator + seed + `next dev` (with `.env.emulators` injected) as one process tree. Used by both `npm run dev` and Playwright's webServer.
- Auth state for seeded users is captured by `e2e/global-setup.ts` and loaded per-role via `browser.newContext({ storageState })`.

**The no-drift rule** — tests must drive the app through the same surfaces a real user uses:
- ✅ Setup may call real admin APIs (e.g., `createContest` fixture hitting `POST /api/contest/contests`). Emulator-level data reset is fine.
- ❌ **No test-only endpoints.** If the real admin UI can't do it, neither can a test.
- ❌ **No direct provider calls from specs.** Never import `firestoreAdminAdapter` or call `contestApi.submitScore` from a spec body — votes go through clicks, phase transitions go through clicks.
- ❌ **No mocked internals in E2E.** Real Firestore (emulator), real API, real React, real MUI.
- ❌ **No hidden test-only controls.** If adding a `data-testid` to make a selector stable, the element must remain a normal user-facing control — never add an invisible shortcut for tests.

This applies doubly for agentic automation: any hook added to enable AI-driven testing must mimic user surfaces (clicks, form fills, keyboard), not invoke path-critical methods directly.

### Styling

- Global styles in `app/globals.scss`.
- Feature styles organized under `src/features/contest/styles/` with SCSS partials (`_admin-styles.scss`, etc.).
- MUI v6 with Emotion for component-level theming.

