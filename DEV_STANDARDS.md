# Dev Standards

## Scope

These rules apply to active contest-app work by default. The DC calculator is a legacy exception area unless a task explicitly asks for deeper cleanup there.

## Component and hook design

- Keep components focused and small enough to scan quickly.
- Move business logic into hooks or pure helpers when JSX starts carrying too much logic.
- Prefer pure derivation helpers for contest state transformations.
- Avoid placeholder abstractions that do not own real behavior.

## Imports and boundaries

- Use `@/contest/*` for contest feature code.
- Use `@/components/*` for shared app-shell code.
- Do not introduce new `@/src/*` imports.
- Route handlers are the canonical CRUD boundary for contest operations.
- Direct Firebase client access is for auth and live subscriptions only.

## Styling

- Prefer tokens and mixins over ad hoc values.
- Keep global styles limited to app-shell concerns.
- Keep contest styles inside `src/features/contest/styles/`.
- Preserve the DC calculator’s runtime behavior when deduplicating shared style primitives.

## TypeScript and data modeling

- Keep domain helpers pure where possible.
- Export reusable types from stable feature paths.
- Prefer explicit result shapes over nullable magic values when a shared helper owns API behavior.

## React guidance

- We are on React 19 with the React Compiler.
- Do not add `useMemo` or `useCallback` by default unless they are clearly needed for a real boundary.
- Colocate state with the component or feature that truly owns it.

## Required checks

- `npm run lint`
- `npm run type-check`
- `npm run test`
- `npm run docs:validate`

Update docs when architectural or routing truth changes.
