# Agent Router

Do not read this whole folder by default.
For any task, open one primary guide only. Open a second guide only if the task crosses that boundary or the first guide sends you there.

## Pick One Primary Guide

- Route, layout, or file placement: [ORG_MAP.md](ORG_MAP.md)
- Live data, context, or Firestore subscriptions: [CONTEST_DATA_FLOW.md](CONTEST_DATA_FLOW.md)
- Display or dashboard work: [DISPLAY_MODE_NOTES.md](DISPLAY_MODE_NOTES.md)
- SCSS, tokens, mixins, or theming: [SASS_PREFERENCES.md](SASS_PREFERENCES.md)
- Refactors, simplification, or risk review: [CODE_SMELLS.md](CODE_SMELLS.md)
- Tests, pure helpers, or safest seams: [TESTING_SEAMS.md](TESTING_SEAMS.md)

## Escalate Context Only When Needed

- Display route or TV layout: start with [DISPLAY_MODE_NOTES.md](DISPLAY_MODE_NOTES.md), then read [ORG_MAP.md](ORG_MAP.md) if you need file locations.
- Subscription or live-update issue: start with [CONTEST_DATA_FLOW.md](CONTEST_DATA_FLOW.md), then read [TESTING_SEAMS.md](TESTING_SEAMS.md) if you are adding coverage.
- Styling task: read [SASS_PREFERENCES.md](SASS_PREFERENCES.md) only.
- Cleanup task: read [CODE_SMELLS.md](CODE_SMELLS.md), then open the single code file you are changing.
- New test work: read [TESTING_SEAMS.md](TESTING_SEAMS.md), then the helper being tested.

## Repo Rules Learned From Reading

- Contest pages are client pages and read contest id from `useParams()`.
- Live contest state comes from `useContestSubscription(id)` pushing into `ContestContext`.
- Bracket UI should stay render-only; derivation belongs in `src/features/contest/lib/helpers`.
- `app/(contest)/layout.tsx` owns contest SCSS, but `app/RootLayoutClient.tsx` owns the global `SiteHeader`.
- `ActiveContestProvider` is still wired in, but it is a placeholder and does not provide the current contest.