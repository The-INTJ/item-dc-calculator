# Repo Guide

## Priorities

- Treat the contest app as the active product area.
- Treat `src/features/dc-calculator/` and `app/(dc-calculator)/` as frozen unless a task explicitly targets them.
- Prefer fixing architecture and docs drift over adding more one-off guidance files.

## Canonical paths

- Contest feature code: `src/features/contest/`
- Shared shell/UI: `src/components/`
- API handlers: `app/api/contest/`
- Durable repo docs: root `ARCHITECTURE.md`, `DEV_STANDARDS.md`, `CONTRIBUTING.md`

## Import rules

- Prefer `@/contest/*` for contest feature imports.
- Prefer `@/components/*` for shared UI.
- Do not add new `@/src/*` imports.

## Data path rules

- Live contest CRUD currently goes through the browser Firebase-backed provider in `src/features/contest/lib/api/`.
- Direct Firebase usage outside that client layer should stay limited to auth and live subscriptions.
- `app/api/contest/openapi.json` documents the HTTP contract for route handlers, but the browser app is not fully migrated to that path yet.
- Do not move a browser flow onto route handlers unless the server-side auth and provider story moves with it.
- Voting reads should prefer cached entry aggregates (`sumScore`, `voteCount`) over recounting the votes collection.

## Required checks

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run docs:validate`

## Documentation rules

- Update root docs when route structure, workflow, or architecture changes.
- Prefer folder README files over adding new top-level one-off notes.
- `AI_Assistance/` is archival; do not treat it as the canonical architecture source.
