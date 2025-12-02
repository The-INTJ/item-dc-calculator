# Item DC Calculator (Next.js)

A Next.js app router project that now hosts two experiences:
- The new Mixology Rating App (contest-first entry point)
- The legacy D&D item DC calculator (available on a dedicated route)

## Getting started
- Install dependencies: `npm install`
- Run the dev server: `npm run dev`
- Lint: `npm run lint`
- Build for production: `npm run build` then `npm start`

Tooling notes:
- ESLint uses the flat config in `eslint.config.js`; the legacy `.eslintrc.json` file has been removed.

## Project layout
- `app/` — Next.js entry points. The default landing highlights the mixology shell; `layout.tsx` loads global SCSS once for the whole app.
- `src/` — Calculator components, styles, and utility logic preserved from the Vite project.
- `public/` — Static assets served by Next.js.

## Mixology Rating App (current focus)
- Primary route: `/mixology` (also linked from the site header). The legacy calculator remains at `/legacy`.
- Step 1 complete: routing and landing shell coexist with the calculator.
- Step 2 started: typed contest/drink/judge/score model plus seeded, read-only API responses.
  - `GET /api/mixology/contests` returns all seeded contests and the default/current contest snapshot.
  - `GET /api/mixology/contests?slug={contestSlug}` returns a specific contest (404 if missing).
- Progress log: see `Mixology Rating App Progress.md` for roadmap and decisions.

### Adding new pages
Create a new route folder in `app/` (e.g., `app/my-idea/page.tsx`) and compose components from `src/` or new ones. Mark client components with `'use client'` when they need hooks or browser APIs.

### Migration shortcuts to revisit
- Global styles are imported centrally in `app/globals.scss` rather than converted to CSS Modules. If you want tighter style scoping, migrate these to modules incrementally.
- The calculator runs fully on the client to keep `localStorage` access simple. Server Components/SSG can be introduced later once persistence is abstracted from browser APIs.
