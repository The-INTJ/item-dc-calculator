# Architecture Guide

> **Audience**: AI coding assistants. Optimized for LLM context windows.
> For code-quality rules, see [DEV_STANDARDS.md](DEV_STANDARDS.md).

---

## What This Repo Is

A **Next.js App Router** application hosting two experiences:

1. **Contest Rating App** (active development) — A generic contest judging platform. Judges rate entries (drinks, chili, cosplay, dance, etc.) across configurable scoring attributes. Supports rounds, brackets, matchups, multi-judge scoring.
2. **D&D Item DC Calculator** (legacy/frozen) — A client-side tool for calculating Difficulty Class values for custom D&D magic items. Data persists in `localStorage`. No server interaction.

### DC Calculator Boundary

**Do not modify** anything under `src/features/dc-calculator/` or `app/(dc-calculator)/` **unless explicitly asked**. Treat it as frozen code.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.1.x |
| React | React 19 with React Compiler | ^19.0.0 |
| UI Library | MUI (Material UI v6) | ^6.4.x |
| Auth + Database | Firebase (client SDK) | ^12.6.x |
| Server Auth | Firebase Admin SDK | ^12.7.x |
| Styling | SCSS/SASS + CSS Modules (selective) | sass ^1.81.x |
| API Docs | Scalar (OpenAPI 3.1.0 reference) | @scalar/nextjs-api-reference |
| Testing | Vitest + jsdom + Testing Library | vitest ^4.x |
| TypeScript | Strict mode, `noImplicitAny` | ^5.7.x |
| Deployment | Vercel | `vercel.json` → `{ "framework": "nextjs" }` |
| Build | babel-plugin-react-compiler | ^1.0.0 |

**Key constraint**: React Compiler is enabled — `useMemo` is banned. See DEV_STANDARDS.md.

---

## Directory Structure

```
app/
├── layout.tsx                        # Root layout (html/body, globals.scss)
├── RootLayoutClient.tsx              # 'use client' — nests global providers + SiteHeader
├── page.tsx                          # Landing page (Server Component, force-dynamic)
├── page.module.scss
├── globals.scss                      # Global styles (site-wide + dc-calculator imports)
│
├── (contest)/                        # Route group — no URL segment. Adds ActiveContestProvider.
│   ├── layout.tsx                    # 'use client' — wraps ActiveContestProvider, imports contest.scss
│   ├── contest.scss                  # Contest feature style aggregator
│   ├── account/page.tsx              # /account — user session management
│   ├── admin/page.tsx                # /admin — AdminDashboard (Server Component shell)
│   ├── admin/contest-setup/page.tsx  # /admin/contest-setup — contest creation form
│   ├── contest/[id]/page.tsx         # /contest/:id — dynamic contest page (bracket + voting)
│   └── onboard/page.tsx              # /onboard — guest/Google sign-in flow
│
├── (dc-calculator)/                  # Route group — no URL segment. Metadata-only layout.
│   └── dc-calculator/page.tsx        # /dc-calculator — renders DC calculator App component
│
└── api/contest/                      # REST API (see API Layer section)
    ├── openapi.json                  # OpenAPI 3.1.0 spec (source of truth)
    ├── _lib/requireAdmin.ts          # Admin auth guard (currently disabled)
    ├── docs/route.ts                 # GET — Scalar API reference viewer
    ├── current/route.ts              # GET — default contest
    └── contests/
        ├── route.ts                  # GET (list/by-slug), POST (create)
        └── [id]/
            ├── route.ts             # GET, PATCH, DELETE
            ├── entries/
            │   ├── route.ts         # GET (list), POST (create)
            │   └── [entryId]/route.ts  # GET, PATCH, DELETE
            └── scores/route.ts      # GET (?entryId/?judgeId filter), POST (submit/update)

src/
├── components/                       # Shared UI (barrel-exported via index.ts)
│   ├── layout/                       # NavBar, SiteHeader, navItems
│   └── ui/                           # AdminOnlyLink, AuthPrimaryAction, ConfirmDialog
│
└── features/
    ├── contest/
    │   ├── components/
    │   │   ├── admin/                # ~13 admin components (dashboard, cards, forms, rounds)
    │   │   ├── auth/                 # AuthModal, GuestPrompt, LoginForm, RegisterForm, UserMenu
    │   │   ├── ui/                   # BracketView, EntryCard, RoundCard, VoteModal, VoteScorePanel, etc.
    │   │   └── votePage/             # VoteActions, VotePageHeader
    │   ├── contexts/                 # React contexts (see State Architecture)
    │   ├── lib/
    │   │   ├── api/                  # Client API services + server auth
    │   │   ├── firebase/             # Backend providers, adapters, scoring logic
    │   │   └── helpers/              # Types, templates, backend provider factory, score normalization
    │   ├── styles/                   # Design token system (see Styling)
    │   └── ViewSnippets/             # Composite view fragments (ListOfContests, SignedInActions)
    │
    └── dc-calculator/                # ⛔ FROZEN — do not touch unless asked
```

### Barrel Export Pattern

`src/components/index.ts` → re-exports `./ui` and `./layout`. Sub-folders each have their own `index.ts`. Import shared components via `@/components`.

---

## Routing

**Route groups** `(contest)` and `(dc-calculator)` produce no URL segment — they exist to scope layouts and providers.

| URL | Page File | Component Type | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | Server Component | `force-dynamic`, calls `getCurrentUser()` SSR |
| `/account` | `app/(contest)/account/page.tsx` | Client | User session management |
| `/admin` | `app/(contest)/admin/page.tsx` | Server Component | AdminDashboard shell |
| `/admin/contest-setup` | `app/(contest)/admin/contest-setup/page.tsx` | Client | Contest creation form |
| `/contest/:id` | `app/(contest)/contest/[id]/page.tsx` | Client | Dynamic — bracket + voting |
| `/onboard` | `app/(contest)/onboard/page.tsx` | Client | Guest/Google sign-in flow |
| `/dc-calculator` | `app/(dc-calculator)/dc-calculator/page.tsx` | Client | DC calculator (frozen) |
| `/api/contest/docs` | `app/api/contest/docs/route.ts` | Route Handler | Scalar API reference |

**No middleware** exists (`middleware.ts` is absent).

---

## Context / State Architecture

### Provider Nesting (Root → Leaf)

```
<AuthProvider>                    ← Firebase auth state machine
  <RoundStateProvider>            ← Tracks contest phase (set/shake/scored)
    <ContestProvider>             ← Contest list, CRUD, voting
      <SiteHeader />
      <main>
        {children}               ← All routes get these three providers
      </main>
    </ContestProvider>
  </RoundStateProvider>
</AuthProvider>
```

Inside `(contest)` layout only:
```
<ActiveContestProvider>           ← Placeholder — contest selection moving to URL params
  {children}
</ActiveContestProvider>
```

### Context Details

| Context | File | State Pattern | Manages |
|---|---|---|---|
| **AuthContext** | `contexts/auth/AuthContext.tsx` | `useReducer` with discriminated union | Auth state machine: `loading → authenticated \| guest \| unauthenticated \| error`. Login/logout/register actions. Session includes `firebaseUid`, `profile` (displayName, email, role, avatarUrl). |
| **RoundStateContext** | `contexts/RoundStateContext.tsx` | Simple state | Current contest phase tracking (`set \| shake \| scored`) |
| **ContestContext** | `contexts/contest/ContestContext.tsx` | `useState` + `useCallback` | Contest list + CRUD. Delegates to 3 hooks: `useFetchContestsOnMount`, `useContestActions`, `useVoting` |
| **ActiveContestContext** | `contexts/ActiveContestContext.tsx` | Simple state | Selected contest (transitioning to URL params) |

**Auth reducer actions**: `LOADING`, `AUTHENTICATED`, `GUEST`, `ERROR`, `LOGOUT` (→ `unauthenticated`), `UPDATE_SESSION`.

---

## Data Model (Conceptual)

> Full field-level definitions: see `app/api/contest/openapi.json`

### Entity Relationships

```
Contest (top-level Firestore document)
├── config: ContestConfig        → defines topic, entryLabel, attributes[]
├── phase: ContestPhase          → 'set' | 'shake' | 'scored'
├── entries: Entry[]             → nested array (not a subcollection)
├── judges: Judge[]              → nested array
├── scores: ScoreEntry[]         → nested array
└── rounds: ContestRound[]       → nested array
```

### Key Types

| Type | Key Fields | Notes |
|---|---|---|
| `Contest` | id, name, slug, phase, config, entries[], judges[], scores[], rounds[] | Top-level aggregate |
| `ContestConfig` | topic, attributes: AttributeConfig[], entryLabel?, entryLabelPlural? | Defines scoring rubric |
| `Entry` | id, name, round, submittedBy, scoreByUser?, scoreTotals?, scoreLock? | Contest participant |
| `Judge` | id, displayName, role: JudgeRole, contact? | Evaluator |
| `ScoreEntry` | id, entryId, judgeId, breakdown: ScoreBreakdown, notes?, naSections? | One judge's scores for one entry |
| `ContestRound` | id, name, number?, state: ContestPhase | Round within a contest |
| `ScoreBreakdown` | `Record<string, number \| null>` | Keys are dynamic — derived from config attributes |
| `JudgeRole` | `'admin' \| 'judge' \| 'viewer'` | Authorization tier |
| `ContestPhase` | `'set' \| 'shake' \| 'scored'` | Contest/round lifecycle |

### Storage Model

Entries, judges, scores, and rounds are stored as **arrays within the Contest document** (not Firestore subcollections). The `arrayEntityAdapter` (`src/features/contest/lib/firebase/arrayEntityAdapter.ts`) provides generic CRUD over these arrays via `createArrayEntityOperations<T>`.

---

## API Layer

### Three Tiers

```
Client code
  → contestApi.ts / adminApi.ts          [Client API services]
    → fetch('/api/contest/...')
      → Route Handler                    [app/api/contest/...]
        → getBackendProvider()            [Singleton factory]
          → FirebaseBackendProvider       [Implements BackendProvider interface]
            → arrayEntityAdapter          [Generic array CRUD]
              → Firestore                 [Firebase database]
```

### Client API Services

| File | Returns | Auth | Usage |
|---|---|---|---|
| `lib/api/contestApi.ts` | `T \| null` | `getAuthToken()` → Bearer header | General contest operations |
| `lib/api/adminApi.ts` | `ProviderResult<T>` | Same | Admin-focused operations |

`ProviderResult<T>` = `{ success: boolean; data?: T; error?: string }`

### API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/contest/current` | Default contest |
| GET | `/api/contest/contests` | List all (or `?slug=X`) |
| POST | `/api/contest/contests` | Create contest |
| GET | `/api/contest/contests/:id` | Get by ID |
| PATCH | `/api/contest/contests/:id` | Update contest |
| DELETE | `/api/contest/contests/:id` | Delete contest |
| GET | `/api/contest/contests/:id/entries` | List entries |
| POST | `/api/contest/contests/:id/entries` | Create entry |
| GET | `/api/contest/contests/:id/entries/:entryId` | Get entry |
| PATCH | `/api/contest/contests/:id/entries/:entryId` | Update entry |
| DELETE | `/api/contest/contests/:id/entries/:entryId` | Delete entry |
| GET | `/api/contest/contests/:id/scores` | Get scores (`?entryId`, `?judgeId`) |
| POST | `/api/contest/contests/:id/scores` | Submit/update score |

**Admin auth** (`_lib/requireAdmin.ts`) exists but is **currently commented out** in all route handlers.

**API docs**: OpenAPI spec at `app/api/contest/openapi.json`, interactive viewer at `/api/contest/docs` (Scalar).

### Backend Provider

The `BackendProvider` interface (defined in `lib/helpers/types.ts`) has four sub-providers:

- `contests: ContestsProvider` — top-level Firestore document CRUD
- `entries: EntriesProvider` — array entity adapter for entries[]
- `judges: JudgesProvider` — array entity adapter for judges[]
- `scores: ScoresProvider` — array entity adapter for scores[]

All return `ProviderResult<T>`. Singleton instance via `getBackendProvider()` in `lib/helpers/backendProvider.ts`.

---

## Authentication

### Client-Side (Firebase Auth)

- **Methods**: Email/password, Google OAuth, Anonymous sign-in
- **Provider**: `firebaseAuthProvider.ts` implements the auth provider interface
- **State machine** (managed by `useAuthReducer`):
  ```
  loading → authenticated   (signed-in user with profile)
          → guest            (anonymous sign-in)
          → unauthenticated  (signed out)
          → error            (auth failure)
  ```
- **Session shape**: `{ sessionId, status, firebaseUid, profile: { displayName, email, role, avatarUrl }, createdAt, updatedAt }`
- **Roles**: `admin | judge | viewer` (type `JudgeRole`)

### Server-Side

| Function | Source | Method |
|---|---|---|
| `getCurrentUser()` | `lib/api/serverAuth.ts` | Reads `__session` cookie → `verifySessionCookie()` via firebase-admin |
| `getCurrentUserFromRequest(req)` | `lib/api/serverAuth.ts` | Checks `Authorization: Bearer <token>` → `verifyIdToken()`, falls back to `getCurrentUser()` |

---

## Data Flow Patterns

### Contest Read Flow

```
Page mount
  → useFetchContestsOnMount (hook in ContestContext)
    → contestApi.listContests()
      → fetch GET /api/contest/contests
        → Route handler → getBackendProvider().contests.list()
          → Firestore query
  → Response parsed → ContestContext state updated
```

### Vote / Score Submission (Dual-Write)

```
User submits scores in VoteModal
  → useRoundVoting.submit()
    1. POST /api/contest/contests/:id/scores     ← API writes to scores[] in contest doc
    2. recordVote() from useVoting hook           ← Client SDK writes to Firestore 'votes' collection directly
```

The dual-write ensures scores are in both the contest aggregate and a flat `votes` collection for querying.

### Score Locking

`lib/firebase/scoring/scoreLock.ts` implements **optimistic locking with exponential backoff** for concurrent score updates to prevent lost writes.

---

## Styling

### Contest App

Uses a **design token system** in `src/features/contest/styles/`:

```
tokens/          → Primitives: _colors, _spacing, _typography, _radii, _shadows, _motion, _zindex, _breakpoints, _layout
semantic/        → Theme mappings: _core, _dc-calculator, _mixology
mixins/          → Reusable patterns: _typography, _layout, _surface, _interactive, _container, _tokens
functions/       → Computed values: _color, _math
components/      → Component-specific CSS Modules (e.g., Header.module.scss)
```

**Loading**: `app/(contest)/contest.scss` → `@use` imports from the above structure.

**Global classes**: BEM-like naming (e.g., `contest-card`, `admin-dashboard__header`, `site-nav__link--active`) defined across feature SCSS partials: `_admin-styles.scss`, `_auth-styles.scss`, `_rounds-styles.scss`, `_entry-styles.scss`, `_bracket-styles.scss`, `_vote-styles.scss`, `_account-styles.scss`.

**CSS Modules**: Used selectively — `ListOfContests.module.scss`, `page.module.scss`, `Header.module.scss`.

**MUI ThemeProvider**: Active in the DC calculator. Contest app primarily uses SCSS design tokens.

### DC Calculator (Frozen)

SCSS partials loaded via `app/globals.scss` → `@use '../src/features/dc-calculator/index'`. Has two MUI themes (`mixology`, `dc-calculator`) in `src/features/dc-calculator/theme/`.

> For color/styling rules, see DEV_STANDARDS.md §2.

---

## Firebase / Infrastructure

### Firestore Collections

| Collection | Purpose |
|---|---|
| `contests` | Main contest documents (entries, judges, scores, rounds as nested arrays) |
| `users` | User profiles (displayName, email, role, timestamps) |
| `guests` | Guest user records |
| `votes` | Flat vote records (userId, contestId, entryId, score, breakdown) |

### Emulators (local dev)

| Service | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Emulator UI | enabled |

Config: `firebase.json` with `singleProjectMode: true`.

### Environment Variables

**Client-side (`NEXT_PUBLIC_`)**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` — enables emulators when `true`

**Server-side only**:
- `FIREBASE_ADMIN_SERVICE_ACCOUNT` — full JSON string (project_id, client_email, private_key)
- Or individually: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
- `CONTEST_ALLOW_ADMIN_HEADER` — enables legacy `x-contest-role` header auth (non-prod only)

---

## TypeScript Path Aliases

| Alias | Maps To |
|---|---|
| `@/*` | `./*` (project root) |
| `@/components/*` | `./src/components/*` |
| `@/features/*` | `./src/features/*` |
| `@/lib/*` | `./src/lib/*` |
| `@/contest/*` | `./src/features/contest/*` |

---

## Contest Templates

Four built-in templates in `lib/helpers/contestTemplates.ts`:

| Key | Topic | Entry Label | Scoring Attributes |
|---|---|---|---|
| `mixology` | Mixology | Drink | aroma, taste, presentation, xFactor, overall |
| `chili` | Chili | Chili | heat, flavor, texture, appearance, overall |
| `cosplay` | Cosplay | Cosplay | accuracy, craftsmanship, presentation, creativity |
| `dance` | Dance | Performance | technique, musicality, expression, difficulty, overall |

---

## Known Quirks / Legacy

- **"Mixology" remnants**: Root layout metadata title, AdminDashboard heading, auth init defaults, theme names, SCSS semantic file `_mixology.scss`, and various comments still reference the original "Mixology" app name.
- **No tests exist**: Vitest is configured but zero test files are present.
- **No middleware**: No `middleware.ts` file.
- **`db.json`**: Legacy seed data for the DC calculator (D&D items). Ignore.
- **`@base-ui-components/react`**: Installed (alpha) but usage is minimal/exploratory.

---

## NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local dev server |
| `dev:prod` | `next dev --env-file .env.production` | Dev with production env |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `next lint` | ESLint |
| `type-check` | `tsc --noEmit` | TypeScript check |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Watch mode |
| `docs:validate` | `npx swagger-cli validate app/api/contest/openapi.json` | Validate OpenAPI spec |

---

## Cross-References

| Document | Purpose |
|---|---|
| [DEV_STANDARDS.md](DEV_STANDARDS.md) | Code quality rules: component size, styling, MUI usage, TypeScript, accessibility |
| [BugList.md](../BugList.md) | Known bugs |
| [CurrentPlan.md](../Plans/CurrentPlan.md) | Active development plan |
| [openapi.json](../app/api/contest/openapi.json) | Full API field-level documentation |
