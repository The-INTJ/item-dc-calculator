# Adversarial review

Scope: refactor `cdfbd05..c31dbab` and the current repository, reviewed 2026-07-31, followed by the source-length enforcement work on `codex/length-lint`.

## Verdict

- Keep the global source-file hard cap at **fewer than 200 logical lines**. The enforced maximum is 199. Lowering it globally would create artificial seams in cohesive domain code.
- Keep the function hard cap at **80 logical lines**, with 60 as the review warning.
- The JavaScript/TypeScript policy is now enforced on eligible staged files. Existing debt is not grandfathered when its file is touched.
- **Open recommendation, not implemented:** a stricter 160-line cap for UI components, hooks, route handlers, and provider/action factories. The shipped gate applies one 199-line cap to all eligible code.
- No user-visible bug from the split was reproduced. The split did introduce a runtime import cycle in the Harmonizer NCT modules.
- The largest remaining structural debt is in stylesheets, documentation/contracts, duplicated persistence code, and cross-feature ownership.

## Source-length enforcement

Husky runs lint-staged before commits. A separate ESLint configuration applies `max-lines` and `max-lines-per-function` only to maintained staged code under `app/` and `src/`. Blank and comment-only lines do not count.

The frozen DC calculator, tests, E2E, fixtures, knowledge/content data, generated code, declarations, and conventionally named type-only files are exempt. Normal `npm run lint` remains green; the staged gate is the ratchet. A touched file must be below 200 lines and every function in it must be at most 80 lines.

The current tree has no eligible source file at 200 or more logical lines. It still has function violations. Those functions do not block unrelated commits, but staging their files requires splitting them.

### Measurements behind the cap

After the documented exemptions, 433 code files were measured: 23 are between 161 and 200 lines, none exceed 200, p95 is 164, and p99 is 192. Active contest code has 11 files between 161 and 200. A global cap below 200 would force low-value splits in cohesive modules such as `nct-classification.ts` (185), `melody-interpretation.ts` (181), and `build-candidate.ts` (181); none contains an oversized function.

The current problem is function size, not the global file cap. Active contest code still has 20 non-test functions above 80 lines, and the refactor introduced eight of them. Examples include `useAuthActions` at 164 lines and Firestore adapter factories at 100–134 lines.

## Split regressions

No behavioral regression was confirmed by parent-versus-HEAD inspection, unit tests, type checking, linting, or browser coverage. The refactor generally preserved logic behind concept-named modules and narrow barrels.

The new `nct.ts` / `nct-classification.ts` boundary creates a runtime cycle: `nct.ts` re-exports the classifier while the classifier imports runtime primitives from `nct.ts`. It works under current tests, but module initialization order is now a hidden constraint. Move the shared primitives to a neutral module.

Plants and Pilates still have less regression coverage than contest and Harmonizer, so confidence in their split UI remains lower.

## Stylesheet plan

### Target

CSS and SCSS should use the same **199 logical-line maximum** as source code. Blank lines and comment-only lines should not count. There are 13 current offenders, led by:

- Contest display: 924 logical lines.
- Harmonizer candidate inspector: 603.
- Pilates Mentors page module: 593.
- Plant Card module: 540.
- Contest design system: 428.
- Eight additional contest, plant, and Harmonizer stylesheets between 203 and 306.

### Split order

1. Move styles from the four largest files to the components already extracted by the TypeScript split. Keep only true parent layout in the parent module.
2. Split contest globals by rendered surface: display shell/hero, bracket/matchups, face-off, feed/champion, design primitives, voting, rounds, admin details, landing, and authentication.
3. Split the remaining 200–300-line component modules along their existing component boundaries.
4. Preserve Sass load order and selector specificity. Keep media queries, animations, and state selectors beside the component they modify; do not create responsive, animation, or miscellaneous dumps.

### Lint rollout

Stylelint has no core file-length rule, so stylesheet length should use a small tested Node checker instead of an abandoned single-purpose plugin. The checker should understand `//` and `/* ... */` comments and use the same logical-line definition as ESLint.

Add CSS/SCSS to lint-staged at the start of the style migration. New and already-compliant files fail above 199 immediately. For the 13 legacy offenders, compare staged content with `HEAD`: growth fails, reduction passes. Remove the `HEAD` comparison after all offenders are below the cap so every stylesheet uses the strict rule.

Before moving selectors, add focused desktop/mobile screenshot coverage for contest display, Harmonizer inspector, Pilates, and expanded Plant Card states. After each split, require Sass compilation, those visual comparisons, and the relevant browser suite.

## Other maintenance concerns

1. **Canonical documentation cannot be trusted.** `ARCHITECTURE.md`, `AGENTS.md`, `CONTRIBUTING.md`, and the contest READMEs give contradictory browser-Firebase and REST/Admin data paths. The code uses REST/Admin. Root docs omit the new `/harmonizer` experience, and the Harmonizer README still names files replaced by this split.

2. **The HTTP contract is wrong.** `app/api/contest/openapi.json` documents five nonexistent `/contests/{id}/entries...` operations and omits the live matchup-entry `PUT` route. `docs:validate` passes because `scripts/build-openapi.ts` regenerates schemas only; it does not compare routes with the path contract.

3. **Persistence logic has two copies and no conformance suite.** `firestoreAdapter/` and `firestoreAdminAdapter/` duplicate contest, matchup, score, vote, and cascade behavior. Route tests mock the provider. Consolidate the implementations or run the same behavioral contract tests against both.

4. **Contest models have two owners.** Zod schemas coexist with hand-written types in `contexts/contest/contestTypes.ts`, while backend, domain, adapter, and route code import the React-context types. A model change requires parallel edits and reverses the intended dependency direction.

5. **Feature ownership leaks.** Plants and shared shell code import contest-private auth, fetch, Firebase Admin, recent-contest, and style modules. Contest maintenance can therefore break other experiences. Shared platform concerns need a neutral home.

6. **Regression gates are incomplete.** The 208-file sweep changed no tests. The required `npm run test` excludes both Playwright suites, and there is no checked-in CI workflow enforcing the staged length gate remotely.

## Validation

The length checker was verified at both boundaries: 199/200 file lines and 80/81 function lines. Exemptions passed, a known 164-line function failed, hook messaging was verified, and partially staged content was handled correctly. `lint`, `type-check`, `docs:validate`, 557 unit tests, 5 Harmonizer browser tests, and 29 contest browser tests all passed.
