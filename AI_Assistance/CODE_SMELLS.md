# Code Smells

## Highest-Value Cleanup Targets

- `src/features/contest/contexts/ActiveContestContext.tsx`: the provider still wraps contest routes, but it always returns `contest: null` and placeholder refresh methods.
- `src/features/contest/contexts/RoundStateContext.tsx`: comments say it syncs from active round data, but it only stores local UI state and dispatches a window event.
- `src/features/contest/contexts/contest/hooks/useContestActions.ts`: `addContest()` calls `replaceContest()`, which only replaces existing items, so a brand-new contest may never enter local state.
- `src/features/contest/lib/helpers/buildRoundsFromContest.ts`: every matchup gets `winnerId: null`, so winner styling exists in the UI but can never activate.
- `src/features/contest/lib/helpers/uiMappings.ts`: `buildRoundSummaryFromContest()` and `buildRoundDetail()` really describe the active round only, but their names read as general-purpose round builders.
- `app/(contest)/contest/[id]/page.tsx` and other files mix `@/src/...` and `@/contest/...` import styles, which makes refactors noisier than they need to be.
- `src/features/contest/styles/mixins/_typography.scss`: `type-secondary` references an undefined token.
- `src/features/contest/lib/firebase/scoring/scoreTransaction.ts`: placeholder file; the real transaction logic lives in `providers/scoresProvider.ts`.

## Why This Matters For Display Mode

- The display feature should avoid depending on placeholder contexts.
- New logic belongs in pure helpers and focused UI components, not in already-ambiguous state layers.
- The more we isolate display mode, the easier it will be to simplify or delete these smells later.

## Safe Simplification Direction

- Standardize on URL-param contest lookup plus `ContestContext`.
- Keep round emphasis derived from contest data, not mirrored UI state.
- Move display-specific computation into `displayModel.ts` and keep it testable.
