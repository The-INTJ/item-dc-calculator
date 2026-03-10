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

- Contest CRUD should go through the Next API layer in `app/api/contest/`.
- Direct Firebase usage is reserved for auth and live subscriptions.
- `app/api/contest/openapi.json` is the API contract for contest endpoints.

## Required checks

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run docs:validate`

## Documentation rules

- Update root docs when route structure, workflow, or architecture changes.
- Prefer folder README files over adding new top-level one-off notes.
- `AI_Assistance/` is archival; do not treat it as the canonical architecture source.
