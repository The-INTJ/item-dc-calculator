# Dev Standards

## Scope

Contest architecture rules apply to contest work by default. The file and function length policy applies to all maintained product code under `app/` and `src/`. The DC calculator is a legacy exception area unless a task explicitly asks for deeper cleanup there.

## Component and hook design

- Keep components focused and small enough to scan quickly — "File and function length" below gives the specific caps.
- Move business logic into hooks or pure helpers when JSX starts carrying too much logic.
- Prefer pure derivation helpers for contest state transformations.
- Avoid placeholder abstractions that do not own real behavior.

## File and function length

Caps are measured in **logical lines** — non-blank, non-comment — so documentation is never penalized. (A heavily documented file like `src/features/contest/lib/domain/bracketMath.ts` is 218 physical lines but only 127 logical.)

| Tier   | Logical lines | Meaning                                                          |
| ------ | ------------- | ---------------------------------------------------------------- |
| Soft   | 100           | Brief check: is there a concept seam worth splitting at?         |
| Medium | 160           | Deliberate look at the file's approach and boundaries.           |
| Fail   | 200+          | Must be split or redesigned. Eligible files must stay under 200. |

- Functions receive a review warning at **60 logical lines** and fail above **80 logical lines**. This is the primary rule — the file cap exists to stop aggregate sprawl after functions are already small.
- Adoption is a strict touched-file ratchet: every eligible staged file must be under 200 lines and every function in it must be at most 80 lines. Touching a legacy function violation requires fixing it in the same change.

**Carve-outs** (exempt from all tiers): hand-authored data and fixtures (e.g. `fixtures/`, `knowledge/`, and `content.ts` files), conventionally named type-only files (e.g. `contestTypes.ts`, `music-types.ts`, and `types.ts`), test files and E2E specs (specs follow `e2e/README.md`'s own ~150-line guidance), generated files, and the frozen DC calculator.

**Split rules:**

- Split by concept and name the file for the concept (`pair-facts.ts`, never `utils.ts`). Do not create `helpers`/`utils`/`misc` files to satisfy a cap.
- A multi-file split lives in a subdirectory with an `index.ts` barrel that exposes only the public seam; internals stay out of the barrel.
- A split must land on a meaningful seam: two or more callers, or a concept someone would search for. Never extract single-caller plumbing (props or params that exist only to reconnect what the split disconnected) just to hit a number.

The staged-file policy is enforced by Husky and lint-staged using ESLint `max-lines` and `max-lines-per-function`. `npm install` activates the hook. Run `npm run lint:length -- <file...>` to reproduce it manually. Do not use `git commit --no-verify` to bypass a failure.

## Imports and boundaries

- Use `@/contest/*` for contest feature code.
- Use `@/components/*` for shared app-shell code.
- Do not introduce new `@/src/*` imports.
- Keep browser CRUD flows inside `src/features/contest/lib/api/*`.
- If you touch route handlers, use their shared helpers instead of repeating HTTP boilerplate.
- Direct Firebase client access outside `lib/api/*` is for auth and live subscriptions only.

## Styling

- Prefer tokens and mixins over ad hoc values.
- Keep global styles limited to app-shell concerns.
- Keep contest styles inside `src/features/contest/styles/`.
- Preserve the DC calculator's runtime behavior when deduplicating shared style primitives.
- The target stylesheet cap is also under 200 logical lines, but CSS/SCSS enforcement remains a separate planned migration; the current commit gate covers JS/TS only.

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
