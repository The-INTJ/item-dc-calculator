# Adversarial review

Scope: refactor `cdfbd05..c31dbab` and the current repository, reviewed 2026-07-31.

## Verdict

- Keep **200 logical lines** as the global hard cap. Lowering it globally would create artificial seams in cohesive domain code.
- Add a stricter **160-line cap for UI components, hooks, route handlers, and provider/action factories**. Enforce **80 lines per function**, with 60 as a review warning.
- No user-visible bug introduced by the split was reproduced. One structural regression was introduced: a new runtime import cycle in the Harmonizer NCT modules.
- The main maintenance risks are unenforced limits, stale architecture/API documentation, duplicated persistence logic, weak feature boundaries, and unsplit styles.

## File-length cap

After the documented exemptions, 433 code files were measured: 23 are between 161 and 200 lines, none exceed 200, p95 is 164, and p99 is 192. Active contest code has 11 files between 161 and 200. A global cap below 200 would force low-value splits in cohesive modules such as `nct-classification.ts` (185), `melody-interpretation.ts` (181), and `build-candidate.ts` (181); none contains an oversized function.

The current problem is function size, not the global file cap. Active contest code still has 20 non-test functions above 80 lines, and this refactor introduced eight of them. Examples include `useAuthActions` at 164 lines and Firestore adapter factories at 100–134 lines. `DEV_STANDARDS.md` calls for 60–80 lines per function but leaves both file and function limits unenforced, so every required check currently permits this drift.

Styles are outside the effective ratchet. Thirteen SCSS files exceed 200 logical lines; eight belong to contest. `src/features/contest/styles/_display-styles.scss` is about 924 lines and still owns styling for several components that the TypeScript sweep separated. Define a separate stylesheet ratchet rather than applying the TypeScript thresholds blindly.

## Split regressions

No behavioral regression was confirmed by parent-versus-HEAD inspection or automated checks. The refactor mostly preserved logic while moving it behind concept-named modules and narrow barrels.

The new `nct.ts` / `nct-classification.ts` split does create a runtime cycle: `nct.ts` re-exports the classifier, while the classifier imports runtime primitives from `nct.ts`. Tests exercise it successfully today, but module initialization order is now an unstated correctness constraint. Move the shared primitives to a neutral module.

Confidence is lower for Plants and Pilates UI changes because those split surfaces have no component or browser regression coverage.

## Maintenance concerns

1. **Canonical documentation cannot be trusted.** `ARCHITECTURE.md`, `AGENTS.md`, `CONTRIBUTING.md`, and the contest READMEs give contradictory browser-Firebase and REST/Admin data paths. The code uses REST/Admin. Root docs omit the new `/harmonizer` experience, and the Harmonizer README still names files replaced by this split.

2. **The HTTP contract is wrong.** `app/api/contest/openapi.json` documents five nonexistent `/contests/{id}/entries...` operations and omits the live matchup-entry `PUT` route. `docs:validate` passes because `scripts/build-openapi.ts` regenerates schemas only; it does not compare routes with the path contract.

3. **Persistence logic has two copies and no conformance suite.** `firestoreAdapter/` and `firestoreAdminAdapter/` duplicate contest, matchup, score, vote, and cascade behavior. Route tests mock the provider. Consolidate the implementations or run the same behavioral contract tests against both.

4. **Contest models have two owners.** Zod schemas coexist with hand-written types in `contexts/contest/contestTypes.ts`, while backend, domain, adapter, and route code import the React-context types. A model change requires parallel edits and reverses the intended dependency direction.

5. **Feature ownership leaks.** Plants and shared shell code import contest-private auth, fetch, Firebase Admin, recent-contest, and style modules. Contest maintenance can therefore break other experiences. Shared platform concerns need a neutral home.

6. **Regression gates are incomplete.** The 208-file sweep changed no tests. The required `npm run test` excludes both Playwright suites, and there is no checked-in CI workflow or executable file-length ratchet.

## Validation performed

`lint`, `type-check`, `docs:validate`, 557 unit tests, 5 Harmonizer browser tests, and 29 contest browser tests all passed.
