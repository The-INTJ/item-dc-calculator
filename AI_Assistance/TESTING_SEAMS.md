# Testing Seams

## Best Pure Helper Targets

- `src/features/contest/lib/helpers/contestGetters.ts`
- `src/features/contest/lib/helpers/uiMappings.ts`
- `src/features/contest/lib/helpers/buildRoundsFromContest.ts`
- `src/features/contest/lib/helpers/scoreUtils.ts`
- `src/features/contest/lib/firebase/scoring/breakdownUtils.ts`

## First Display-Mode Tests To Add

- `buildDisplayModel(contest)` with 2 rounds and 4 entries.
- Active round selection and future-round naming.
- Matchup pairing for even and odd entry counts.
- Score formatting through `getEntryScore()`.
- Winner detection once the source of winner data is settled.

## Good Integration Boundaries

- `useContestSubscription.ts`: test timer pacing and `upsertContest()` behavior with mocked snapshots.
- `scoresProvider.ts`: test delta math for first vote, vote update, and vote delete.
- `useRoundVoting.ts`: test score defaults and prefill behavior with mocked `contestApi`.

## Current Gaps

- There is no display-model test yet.
- The biggest confidence gain will come from pure derivation tests, not context tests.
- `ActiveContestContext` is not worth expanding test coverage around until it owns real behavior again.
