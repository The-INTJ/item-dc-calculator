# Current Plan — TV Display Mode

> **Goal**: Build a live-updating, big-screen bracket display for any contest.
> **Secondary goal**: Learn the codebase by reading and tracing existing code before writing new code.

Each phase starts with **reading tasks** (files to open, trace, annotate) and ends with a small **build task** that uses what you just learned. The reading is the point — don't skip it.

---

## Phase 0 — Orientation: Know What You Have

No code changes. Pure reading. The purpose is to build a mental map of how a contest page goes from URL to pixels.

### 0.1 Trace the contest page data flow (read-only)

Open each file below, read it top-to-bottom, and write a one-sentence summary comment at the top of your notes (or in this file) describing what the file does and what it depends on.

1. **Entry point**: [app/(contest)/contest/[id]/page.tsx](../app/(contest)/contest/[id]/page.tsx)
   - How does it get the contest ID? What hooks does it call? What components does it render?
2. **Context provider chain**: [app/RootLayoutClient.tsx](../app/RootLayoutClient.tsx) → [app/(contest)/layout.tsx](../app/(contest)/layout.tsx)
   - What providers wrap the contest page? In what order?
3. **Contest context**: [src/features/contest/contexts/contest/ContestContext.tsx](../src/features/contest/contexts/contest/ContestContext.tsx)
   - What does `useContestStore()` return? Where does the contest list come from?
4. **Real-time subscription**: [src/features/contest/lib/hooks/useContestSubscription.ts](../src/features/contest/lib/hooks/useContestSubscription.ts)
   - How does Firestore push updates into React state? What is the pacing mechanism?
5. **Bracket data derivation**: [src/features/contest/lib/helpers/buildRoundsFromContest.ts](../src/features/contest/lib/helpers/buildRoundsFromContest.ts)
   - How does a flat `Contest` object become `BracketRound[]`?
6. **Getter helpers**: [src/features/contest/lib/helpers/contestGetters.ts](../src/features/contest/lib/helpers/contestGetters.ts)
   - What does `getActiveRoundId` do? `getRoundStatus`? `getEntryScore`?
7. **UI mapping helpers**: [src/features/contest/lib/helpers/uiMappings.ts](../src/features/contest/lib/helpers/uiMappings.ts)
   - How are matchups built from entries? What is the pairing algorithm?
8. **BracketView component**: [src/features/contest/components/ui/BracketView.tsx](../src/features/contest/components/ui/BracketView.tsx)
   - What props drive it? What sub-components does it use? How does it handle mobile vs desktop?

### 0.2 Trace the styling system (read-only)

1. [src/features/contest/styles/_bracket-styles.scss](../src/features/contest/styles/_bracket-styles.scss) — The existing bracket CSS. Note the class naming convention (BEM-like) and the design token usage (`$space-*`, `$font-weight-*`, mixins like `@include container`).
2. [src/features/contest/styles/tokens/](../src/features/contest/styles/tokens/) — Open 2–3 token files (`_colors`, `_spacing`, `_typography`). These are your primitives.
3. [src/features/contest/styles/mixins/](../src/features/contest/styles/mixins/) — Skim `_typography`, `_layout`, `_surface`. These are the reusable patterns you'll use.

### 0.3 Trace the type system (read-only)

1. [src/features/contest/contexts/contest/contestTypes.ts](../src/features/contest/contexts/contest/contestTypes.ts) — The core domain types. Pay special attention to: `Contest`, `Entry`, `ContestRound`, `ContestPhase`, `ScoreBreakdown`.
2. [src/features/contest/lib/helpers/types.ts](../src/features/contest/lib/helpers/types.ts) — The backend provider abstraction. Notice how `ProviderResult<T>` wraps everything.

**Checkpoint**: You should now be able to answer, without looking:
- What fields does a `Contest` have?
- How does the active round get determined?
- How does a Firestore snapshot become a bracket on screen?
- What CSS classes style the bracket, and where do they come from?

---

## Phase 1 — Route & Static Shell

Small, contained changes. You'll add the display route and a static placeholder page.

### 1.1 Read the existing route structure

1. Open [app/(contest)/contest/[id]/page.tsx](../app/(contest)/contest/[id]/page.tsx) again.
2. Open [app/(contest)/layout.tsx](../app/(contest)/layout.tsx) — notice how the `(contest)` route group works (no URL segment, just layout scoping).

### 1.2 Create the display route

- [ ] Create `app/(contest)/contest/[id]/display/page.tsx`
- This is a `'use client'` page.
- It should: extract `id` from `useParams`, render a placeholder `<div>` with the contest name and "Display Mode — Coming Soon".
- It should use `useContestStore()` and `useContestSubscription(id)` (same as the existing contest page does).
- **No new components yet** — just prove the route works and has access to contest data.

### 1.3 Add a navigation link

- [ ] In `app/(contest)/contest/[id]/page.tsx`, add a small link/button that navigates to `/contest/${id}/display`.
- Use a Next.js `Link` component. Keep it simple.

---

## Phase 2 — The Display Model

This is the data layer. You'll define the shape of the "display model" and write a pure function to derive it from a `Contest`.

### 2.1 Study the existing derivation pattern (read-only)

Re-read [buildRoundsFromContest.ts](../src/features/contest/lib/helpers/buildRoundsFromContest.ts). Notice:
- It takes a `Contest` and returns `BracketRound[]`.
- It's a pure function — no hooks, no side effects.
- It composes helpers from `contestGetters` and `uiMappings`.

Your display model function will follow this same pattern but produce a richer object.

### 2.2 Define the display model type

- [ ] Create `src/features/contest/lib/helpers/displayModel.ts`
- Define a `DisplayModel` interface:
  ```ts
  interface DisplayRound {
    id: string;
    name: string;
    status: 'upcoming' | 'active' | 'closed';
    isActive: boolean;           // shorthand for emphasis
    matchups: DisplayMatchup[];
  }

  interface DisplayMatchup {
    id: string;
    contestantA: DisplayContestant;
    contestantB: DisplayContestant;
    winnerId: string | null;
  }

  interface DisplayContestant {
    id: string;
    name: string;
    score: number | null;
    isWinner: boolean;
  }

  interface DisplayModel {
    contestId: string;
    contestName: string;
    rounds: DisplayRound[];
    activeRoundId: string | null;
    totalRounds: number;
    phase: ContestPhase;
  }
  ```

### 2.3 Write the derivation function

- [ ] In the same file, write `buildDisplayModel(contest: Contest): DisplayModel`.
- Reuse existing helpers: `getContestRounds`, `getEntriesForRound`, `getEntryScore`, `getRoundStatus`, `getActiveRoundId`, `buildMatchupsFromEntries`.
- This function should be pure and tested (see 2.4).

### 2.4 Write tests

- [ ] Create `src/features/contest/lib/helpers/__tests__/displayModel.test.ts`
- Test with a mock `Contest` object containing 2 rounds and 4 entries.
- Assert the derived model has the correct shape, correct active round, correct scores.
- **This may be the first test in the project.** Use the existing Vitest config.

---

## Phase 3 — Static Bracket UI for Display Mode

Build the visual bracket. Start with hardcoded/mocked data, then wire it up.

### 3.1 Study the existing BracketView (read-only)

Re-read [BracketView.tsx](../src/features/contest/components/ui/BracketView.tsx). Understand:
- The component hierarchy: `BracketView` → `BracketRoundColumn` → `MatchupCard` → `MatchupRow`
- Props are simple data objects, no callbacks needed for display mode (except maybe `onRoundClick` omitted)
- Mobile vs desktop layout strategy

### 3.2 Create the DisplayBracket component

- [ ] Create `src/features/contest/components/ui/DisplayBracket.tsx`
- Props: `{ model: DisplayModel }`
- Renders the same left-to-right column layout as `BracketView`, but:
  - No `onRoundClick` — display only
  - Highlights the active round column
  - Shows winner styling more prominently
- Keep it under ~80 lines (DEV_STANDARDS §1). Extract sub-components as needed:
  - `DisplayRoundColumn`
  - `DisplayMatchupCard`

### 3.3 Create display-specific styles

- [ ] Create `src/features/contest/styles/_display-styles.scss`
- Add TV-friendly overrides: larger font sizes, higher contrast, dark background, generous spacing.
- Use existing design tokens (`$space-*`, `$font-size-*`, color tokens).
- Import it in the contest style aggregator (`app/(contest)/contest.scss`).

---

## Phase 4 — Wire Live Data to Display UI

Connect the display model to real contest data.

### 4.1 Read the subscription pattern again (read-only)

Re-read [useContestSubscription.ts](../src/features/contest/lib/hooks/useContestSubscription.ts). Understand:
- It calls `onSnapshot` on a single Firestore document
- It uses trailing-edge throttle to pace updates
- It calls `upsertContest` to push data into `ContestContext`

The display page will reuse this subscription — no new subscription code needed.

### 4.2 Build the ContestDisplay feature component

- [ ] Create `src/features/contest/components/ui/ContestDisplay.tsx`
- This is the "brain" of the display page. It:
  1. Receives the contest from `useContestStore()` (already subscribed by the page)
  2. Calls `buildDisplayModel(contest)` to derive the display model
  3. Passes the model to `<DisplayBracket />`
- Should be very short (~20–30 lines).

### 4.3 Update the display page

- [ ] Update `app/(contest)/contest/[id]/display/page.tsx` to render `<ContestDisplay />` instead of the placeholder.
- At this point, navigating to `/contest/:id/display` should show a live bracket that updates when scores change.

---

## Phase 5 — Active Round Emphasis & Polish

Visual refinements to make it TV-worthy.

### 5.1 Study the scoring flow (read-only)

Trace how a vote becomes a visible score:
1. [src/features/contest/lib/hooks/useRoundVoting.ts](../src/features/contest/lib/hooks/useRoundVoting.ts) — How does a vote get submitted?
2. [src/features/contest/lib/helpers/scoreUtils.ts](../src/features/contest/lib/helpers/scoreUtils.ts) — How is `calculateScore` implemented?
3. [src/features/contest/lib/firebase/scoring/](../src/features/contest/lib/firebase/scoring/) — How does the score lock / transaction work?
4. Back to `useContestSubscription` — how do score aggregates (`sumScore`, `voteCount` on `Entry`) arrive in the UI?

Understanding this loop is key: vote → Firestore → snapshot → context → derived model → pixel.

### 5.2 Add active round pulse animation

- [ ] In `_display-styles.scss`, add a CSS animation (subtle pulse or glow) for the active round column.
- Use `$transition-*` and `$shadow-*` tokens from the design system.

### 5.3 Add round-transition animations

- [ ] When the active round changes (operator advances the round), add a brief CSS transition that shifts emphasis from the old column to the new one.

### 5.4 Add a "Now Playing" / "Up Next" indicator

- [ ] Extend `DisplayModel` with `activeRoundName` and `nextRoundName` (derived from `getActiveRoundId` and `getFutureRoundId`).
- [ ] Render a header strip above the bracket showing these.

---

## Phase 6 — TV Theme & Full-Screen

### 6.1 Full-screen layout

- [ ] The display page should hide the `SiteHeader` nav bar.
- Approach: the display page can opt out by not rendering inside the normal layout, or by adding a `display-mode` CSS class to body that hides the header. Decide which approach is cleaner after reading how `SiteHeader` is rendered in [RootLayoutClient.tsx](../app/RootLayoutClient.tsx).

### 6.2 TV-optimized theme

- [ ] Dark background, high-contrast text, large type
- [ ] Contest name and round info prominently displayed
- [ ] Scores large and readable from a distance
- All via `_display-styles.scss` tokens, no inline styles.

### 6.3 Auto-scale / viewport handling

- [ ] Ensure the bracket scales well on 1080p and 4K TV resolutions.
- [ ] Use viewport units or container queries for responsive sizing.

---

## Phase 7 — Optional Operator Controls

Only pursue this after Phases 0–6 are complete and working.

### 7.1 Read the admin components (read-only)

Skim these to understand how admin actions currently work:
1. [src/features/contest/components/admin/AdminStateControls.tsx](../src/features/contest/components/admin/AdminStateControls.tsx)
2. [src/features/contest/components/admin/AdminContestRounds.tsx](../src/features/contest/components/admin/AdminContestRounds.tsx)
3. [src/features/contest/components/admin/ContestPhaseControls.tsx](../src/features/contest/components/admin/ContestPhaseControls.tsx)

### 7.2 Add query-param-gated controls

- [ ] When `?controls=true` is in the URL, show a small floating panel on the display page with:
  - Manual active round selector
  - Toggle scores visible/hidden
  - Toggle winner badges visible/hidden
- [ ] Gate behind admin auth check (read [AuthContext.tsx](../src/features/contest/contexts/auth/AuthContext.tsx) to understand role checking).

---

## Summary: Phase → Outcome

| Phase | What You Learn | What You Build |
|-------|---------------|----------------|
| 0 | Full data flow, types, styles, context chain | Nothing (notes only) |
| 1 | Route structure, layout groups, Next.js params | Display route + nav link |
| 2 | Derivation pattern, pure function architecture, testing | `DisplayModel` type + builder + tests |
| 3 | Component decomposition, BEM styling, design tokens | `DisplayBracket` component + styles |
| 4 | Subscription pattern, context consumption | `ContestDisplay` wiring component |
| 5 | Scoring pipeline end-to-end | Animations + round indicators |
| 6 | Layout system, theming approach | Full-screen TV theme |
| 7 | Admin patterns, auth roles | Operator controls (optional) |
