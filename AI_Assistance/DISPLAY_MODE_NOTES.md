# Display Mode Notes

## What The Reading Pass Confirmed

- The existing contest page is already a client-side, live-updating shell.
- The bracket rendering seam is cleanest when we keep data derivation in a pure helper and keep the UI render-only.
- `BracketView` already gives us the left-to-right round structure we want for TV mode.

## Constraints To Respect

- `buildBracketRoundsFromContest()` never sets `winnerId`, so display mode must compute or source winners explicitly.
- `SiteHeader` is rendered in `app/RootLayoutClient.tsx`, not in contest layout, so true full-screen mode needs a header opt-out there or a pathname check inside `SiteHeader`.
- `ActiveContestProvider` does not expose the active contest anymore; display mode should use URL params plus `ContestContext`.
- Active round emphasis should come from `getActiveRoundId()` and `getFutureRoundId()`, not from `RoundStateContext` alone.

## Recommended Build Order After Reading

1. Add `app/(contest)/contest/[id]/display/page.tsx` as a client page that mirrors the existing subscription pattern.
2. Add `buildDisplayModel(contest)` in `src/features/contest/lib/helpers/displayModel.ts`.
3. Add a small `ContestDisplay` container that maps `contest -> model -> <DisplayBracket />`.
4. Add `_display-styles.scss` and import it from `app/(contest)/contest.scss`.
5. Handle header/full-screen behavior only after the display route renders correctly.

## Good First Fields For DisplayModel

- `contestId`
- `contestName`
- `phase`
- `activeRoundId`
- `activeRoundName`
- `nextRoundName`
- `rounds[]` with round status, `isActive`, and display matchups

## Likely Reuse Points

- `getContestRounds()`
- `getEntriesForRound()`
- `getEntryScore()`
- `getRoundStatus()`
- `getActiveRoundId()`
- `getFutureRoundId()`
- `buildMatchupsFromEntries()`
