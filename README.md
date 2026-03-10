# Item DC Calculator

This repository hosts two experiences inside one Next.js App Router app:

- Contest app: the active product area for contest setup, judging, scoring, and display mode
- DC calculator: the legacy D&D item calculator preserved on `/dc-calculator`

The contest app is the active focus. The DC calculator still ships, but it is treated as frozen unless a task explicitly targets it.

## Getting started

1. Install dependencies: `npm install`
2. Start dev: `npm run dev`
3. Run checks:
   - `npm run lint`
   - `npm run type-check`
   - `npm run test`
   - `npm run docs:validate`

Recommended Node version: current LTS (`Node 20`).

## Route map

- `/`: landing page for the contest app
- `/contest/[id]`: live contest page
- `/contest/[id]/display`: big-screen display mode
- `/account`: account/session page
- `/admin`: admin dashboard
- `/admin/contest-setup`: contest creation flow
- `/onboard`: guest/Google sign-in flow
- `/dc-calculator`: legacy calculator

## Repo map

- `app/`: Next.js routes, layouts, and API handlers
- `src/features/contest/`: contest UI, data logic, hooks, styles, and docs
- `src/features/dc-calculator/`: frozen calculator code
- `src/components/`: shared app-shell components
- `public/`: static assets

## Source of truth docs

- `AGENTS.md`: fast repo instructions for contributors and coding agents
- `ARCHITECTURE.md`: durable architecture and data-flow overview
- `DEV_STANDARDS.md`: code-quality and refactor standards
- `CONTRIBUTING.md`: workflow, checks, and doc ownership

Folder-level READMEs live near the code for deeper guidance.
