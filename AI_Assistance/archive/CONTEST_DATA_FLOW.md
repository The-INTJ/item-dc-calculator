# Contest Data Flow

## Contest Page To Bracket

1. `app/(contest)/contest/[id]/page.tsx` reads `id` from `useParams()`.
2. The page calls `useContestSubscription(id)` and reads `contests` from `useContestStore()`.
3. `ContestProvider` starts with `useFetchContestsOnMount()`, which loads contests through `contestApi.listContests()`.
4. `useContestSubscription()` listens to `contests/{id}` in Firestore and pushes updates into `ContestContext` through `upsertContest()`.
5. Updates are paced with a 300 ms trailing-edge timer to avoid snapshot bursts causing too many React updates.
6. The page finds the contest in `contests`, then passes it into `buildBracketRoundsFromContest(contest)`.
7. `BracketView` renders those derived rounds without talking to Firestore directly.

## Active Round Logic

- `getActiveRoundId(contest)` uses `contest.activeRoundId` first, then falls back to the first round id.
- `getFutureRoundId(contest)` uses `contest.futureRoundId` first, then the next round after the active one.
- `getRoundStatus(contest, roundId)` returns `active`, `upcoming`, or `closed` using the active/future ids and round order.
- `getEntriesForRound(contest, roundId)` supports both round ids and legacy round names.
- `getEntryScore(entry)` rounds `sumScore / voteCount` and returns `null` when no votes exist.

## Matchup Derivation

- `buildBracketRoundsFromContest()` gets rounds from `contest.rounds`.
- For each round it grabs round entries with `getEntriesForRound()`.
- `buildMatchupsFromEntries()` pairs entries in source order, two at a time.
- Each matchup becomes `contestantA`, `contestantB`, and currently `winnerId: null`.

## Vote To Live Score Loop

1. `useRoundVoting()` builds score state for the selected round.
2. Submission goes through `contestApi.submitScore()`.
3. `scoresProvider.ts` writes a vote doc in `contests/{contestId}/votes/{userId}_{entryId}`.
4. The same Firestore transaction updates the entry aggregate fields on the contest doc: `sumScore` and `voteCount`.
5. The contest document snapshot fires, `useContestSubscription()` upserts the changed contest, and the bracket scores re-render from aggregates.

## What This Means For New UI

- New bracket UIs should consume derived models, not query votes directly.
- Live updates are already solved at the contest-document level.
- The safest seam for display mode is a pure `Contest -> DisplayModel` helper.
