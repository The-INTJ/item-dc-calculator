# Item DC Calculator (Next.js)

A Next.js app router project that now hosts two experiences:
- The new Contest Rating App (contest-first entry point)
- The D&D item DC calculator app (available on a dedicated route)

## Project context

This repository currently serves two purposes so we can modernize without losing the original tool:
- **DC-calculator app**: the original D&D item DC calculator, preserved as-is with minimal changes to keep it working in the new Next.js shell.
- **Contest Rating App**: the new app we are actively building, focused on contests, judges, and entry scoring.

The README sections below are intended to help React developers ramp up quickly on both areas without wading through the entire codebase.

## Getting started
- Install dependencies: `npm install`
- Run the dev server: `npm run dev`
- Lint: `npm run lint`
- Build for production: `npm run build` then `npm start`

### Node + package manager
- **Recommended**: use **NVM** to pin Node versions across the team.
- **Node version**: Next.js 15 supports Node 18.18+ or newer. If you do not already have a team standard, use the current LTS (Node 20) for consistency.
- If you use NVM, the typical flow is:
  - `nvm install 20`
  - `nvm use 20`
  - `npm install`

Tooling notes:
- ESLint uses the flat config in `eslint.config.js`; the previous `.eslintrc.json` file has been removed.

## Project layout
- `app/` — Next.js entry points. The default landing highlights the contest shell; `layout.tsx` loads global SCSS once for the whole app.
- `src/` — Calculator components, styles, and utility logic preserved from the Vite project.
- `public/` — Static assets served by Next.js.

## DC-calculator app: D&D item DC calculator
The dc-calculator lives inside the Next.js app to keep it accessible while the new contest app is built.

**Where it lives**
- Route: `/dc-calculator`
- Code: `src/` contains the original calculator components, styles, and logic.

**Behavioral notes**
- The calculator runs fully on the client to keep `localStorage` access straightforward.
- Global SCSS is still imported via `app/globals.scss` rather than CSS Modules, so styles apply app-wide.
- The dc-calculator app is a first-class experience with its own dedicated route at `/dc-calculator`.

**Why this matters**
- This codebase is stable and not the active focus, but it still ships. Any shared layout or global style changes can affect it.

## Contest Rating App
This is the app we are actively building: judges rate drinks during contests, with Firebase handling auth and Firestore handling persisted data.

**Where it lives**
- Primary route: `/contest` (also linked from the site header).
- Account/auth flows: `/contest/account`
- Admin/testing shell: `/contest/admin`
- Code: `src/features/contest/` contains the contest domain logic.

**Current state**
- Routing and landing shell are in place alongside the dc-calculator app.
- Typed contest/drink/judge/score model exists with seeded, read-only API responses:
  - `GET /api/contest/contests` returns all seeded contests and the default/current contest snapshot.
  - `GET /api/contest/contests?slug={contestSlug}` returns a specific contest (404 if missing).
- Firebase authentication is implemented; contest data providers are in transition and may still include in-memory behavior.

**Backend/provider setup**
- `src/features/contest/lib/backend` defines the data interfaces and providers.
- `src/features/contest/lib/firebase` includes Firebase-backed auth and data providers.
- `src/features/contest/contexts` contains React contexts for auth and contest data.

**Progress & roadmap**
- See `Plans/CurrentPlan.md` for the current migration plan and decisions.
- Refer to in-repo contest docs and code comments for current setup details.

### Adding new pages
Create a new route folder in `app/` (e.g., `app/my-idea/page.tsx`) and compose components from `src/` or new ones. Mark client components with `'use client'` when they need hooks or browser APIs.

### Migration shortcuts to revisit
- Global styles are imported centrally in `app/globals.scss` rather than converted to CSS Modules. If you want tighter style scoping, migrate these to modules incrementally.
- The calculator runs fully on the client to keep `localStorage` access simple. Server Components/SSG can be introduced later once persistence is abstracted from browser APIs.
