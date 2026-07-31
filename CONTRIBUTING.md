# Contributing

## Local workflow

1. `npm install` (also installs the Husky commit hook)
2. `npm run dev`
3. Make changes
4. Run:
   - `npm run lint`
   - `npm run type-check`
   - `npm run test`
   - `npm run docs:validate`

Eligible staged JavaScript and TypeScript files are checked at commit time for fewer than 200 logical lines and functions no longer than 80 logical lines. Blank and comment-only lines are ignored. Run `npm run lint:length -- <file...>` to check specific files before staging. Fix violations by splitting on a real concept boundary; do not bypass the hook with `--no-verify`.

## Doc ownership

- Root docs own durable repo truth:
  - `README.md`
  - `AGENTS.md`
  - `ARCHITECTURE.md`
  - `DEV_STANDARDS.md`
  - `CONTRIBUTING.md`
- Folder README files own local implementation guidance.

## OpenAPI contract

- `app/api/contest/openapi.json` documents the HTTP route-handler surface, not the browser app's primary runtime path.
- Update the spec when an API route changes request shape, response shape, status codes, or auth requirements.
- Prefer documenting real public auth behavior in the spec. Dev-only fallbacks should stay out of the public contract.
- Validate the spec with `npm run docs:validate`.

## Refactor rules

- Preserve public routes and API shapes.
- Keep `@/contest/*` stable even if files move underneath it.
- Prefer moving code into clearer folders over adding explanation-only docs for avoidable drift.
- Treat generated files and local debug output as untracked artifacts, not repo state.

## Review checklist

- Routes and docs still match
- No new `@/src/*` imports
- Browser CRUD still matches the live Firebase client path
- Route handlers and `openapi.json` still match each other
- Eligible staged files remain under 200 logical lines, functions stay at or below 80, and no `utils`-style dump files were introduced — see `DEV_STANDARDS.md`
- Tests and checks pass
