# Contributing

## Local workflow

1. `npm install`
2. `npm run dev`
3. Make changes
4. Run:
   - `npm run lint`
   - `npm run type-check`
   - `npm run test`
   - `npm run docs:validate`

## Doc ownership

- Root docs own durable repo truth:
  - `README.md`
  - `AGENTS.md`
  - `ARCHITECTURE.md`
  - `DEV_STANDARDS.md`
  - `CONTRIBUTING.md`
- Folder README files own local implementation guidance.
- `AI_Assistance/` is archival and should not be expanded as a second live doc system.

## Refactor rules

- Preserve public routes and API shapes.
- Keep `@/contest/*` stable even if files move underneath it.
- Prefer moving code into clearer folders over adding explanation-only docs for avoidable drift.
- Treat generated files and local debug output as untracked artifacts, not repo state.

## Review checklist

- Routes and docs still match
- No new `@/src/*` imports
- Contest CRUD flows through the API layer
- Direct Firebase usage is limited to approved cases
- Tests and checks pass
