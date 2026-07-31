# Adversarial review

Scope: refactor `cdfbd05..c31dbab`, followed by the source-length enforcement work on `codex/length-lint`.

## Verdict

- Keep the global source-file hard cap at **fewer than 200 logical lines**. The enforced maximum is 199.
- Keep the function hard cap at **80 logical lines**, with 60 as the review warning.
- The JavaScript/TypeScript policy is now enforced on eligible staged files. Existing debt is not grandfathered when its file is touched.
- No user-visible bug from the split was reproduced. The split did introduce a runtime import cycle in the Harmonizer NCT modules.
- The largest remaining structural debt is in stylesheets, documentation/contracts, duplicated persistence code, and cross-feature ownership.

## Source-length enforcement

Husky runs lint-staged before commits. A separate ESLint configuration applies `max-lines` and `max-lines-per-function` only to maintained staged code under `app/` and `src/`. Blank and comment-only lines do not count.

The frozen DC calculator, tests, E2E, fixtures, knowledge/content data, generated code, declarations, and conventionally named type-only files are exempt. Normal `npm run lint` remains green; the staged gate is the ratchet. A touched file must be below 200 lines and every function in it must be at most 80 lines.

The current tree has no eligible source file at 200 or more logical lines. It still has 27 function violations. Those functions do not block unrelated commits, but staging their files requires splitting them.

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

1. **Canonical documentation conflicts with the code.** Root and feature docs describe incompatible browser-Firebase and REST/Admin paths. The code currently uses REST/Admin. Root docs also omit `/harmonizer`, and the Harmonizer README names files replaced by the split.
2. **The OpenAPI contract is wrong.** It advertises five nonexistent contest-entry operations and omits the live matchup-entry `PUT`. `docs:validate` checks schema generation and JSON validity, not route coverage.
3. **Persistence behavior is duplicated.** Browser and Admin Firestore adapters mirror contest, matchup, score, vote, and cascade algorithms without a shared conformance suite.
4. **Contest models have two owners.** Hand-written context types coexist with Zod schemas, while backend and domain code import React-context-owned types.
5. **Feature ownership leaks.** Plants and shared shell code import contest-private auth, fetch, Firebase, recent-contest, and style modules.
6. **Automated gates remain incomplete.** Playwright is outside the required test command and no CI workflow enforces the new manual/staged checks remotely.

## Validation

The length checker was verified at both boundaries: 199/200 file lines and 80/81 function lines. Exemptions passed, a known 164-line function failed, hook messaging was verified, and partially staged content was handled correctly. Lint, type-check, docs validation, and all 557 unit tests passed after the tooling changes.
