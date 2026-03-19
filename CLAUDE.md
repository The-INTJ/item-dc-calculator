# CLAUDE.md

## Commands

- `npm run dev` -- Start dev server
- `npm run dev:prod` -- Start dev server with production env
- `npm run build` -- Production build
- `npm run lint` -- ESLint with zero warnings allowed (`--max-warnings=0`)
- `npm run type-check` -- TypeScript type checking (`tsc --noEmit`)
- `npm test` -- Run all tests once (vitest)
- `npm run test:watch` -- Run tests in watch mode
- `npm run docs:validate` -- Validate OpenAPI spec at `app/api/contest/openapi.json`

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

- Vitest with jsdom environment. Tests live next to source files as `*.test.ts` / `*.test.tsx`.
- API route tests mock `loadProvider` and `requireAdmin` via `vi.mock()`, then call route handlers directly.
- Domain logic tests are pure unit tests with no mocking needed.
- Test files exist in both `src/` and `app/` directories.

### Styling

- Global styles in `app/globals.scss`.
- Feature styles organized under `src/features/contest/styles/` with SCSS partials (`_admin-styles.scss`, etc.).
- MUI v6 with Emotion for component-level theming.
