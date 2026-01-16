# Temp Rounds + Drinks UI Plan

This plan extends the UX and architecture path with robust, repeatable components for rounds, drinks, and votes. The goal is clean separation of data fetching, presentation, and page composition, while keeping components small and theme-aware per the dev standards.

## 1. Core architecture goals
- **Single fetch per surface**: Data should be fetched once at the context boundary and reused across pages/components.
- **Small, composable components**: Round and drink UIs should be presentational; data loading lives in hooks/contexts.
- **Flexible and resilient**: The vote UI must handle 0..N categories, unnamed drinks, and partial data.
- **Backend ready**: Define frontend boundaries that map to backend functions without hard-wiring implementation.

## 2. Data model alignment (frontend-facing)
Define stable UI shapes in types (not models) that map to backend responses:
- `RoundSummary`: id, name, number, status, matchupCount, contestantNames
- `RoundDetail`: id, name, status, contestId, matchups, drinks, voteSummary
- `DrinkSummary`: id, name (nullable), creatorName, imageUrl (optional)
- `VoteCategory`: id, label, description, sortOrder
- `VoteTotals`: drinkId, categoryId, total, userHasVoted

These are display-oriented types to decouple UI from backend fields and allow transformation in a data layer.

## 3. Context + hooks (single-fetch strategy)
Introduce a single data boundary for mixology round/drink data (hook + provider):
- `MixologyDataProvider`
  - fetches current contest, active round, round list, and drink list once
  - exposes cached data + refresh methods
- `useMixologyData()` hook for access

Position it above pages that need round/drink data (mixology layout). This avoids re-fetching when round components mount in multiple places (bracket, admin, vote).

Suggested hierarchy (extends current plan):
```
<AuthProvider>
  <MixologyDataProvider>
    <MixologyLayout>
      {children}
    </MixologyLayout>
  </MixologyDataProvider>
</AuthProvider>
```

## 4. Refresh strategy (not “always fetch”)
We need a balance between freshness and performance:

### Triggers
- **User-initiated refresh**: always re-fetch (pull-to-refresh button, refresh icon, or explicit “Reload”).
- **Navigation to vote page**: revalidate active round (cheap metadata call).
- **Background revalidation**: time-based refresh (e.g., every 2–5 minutes) if user remains on a data-heavy page.

### Strategy
- Use **stale-while-revalidate** semantics at the provider level:
  - Serve cached data immediately.
  - Revalidate in background on page focus or on interval.
  - Provide `refreshAll()` and `refreshRound(roundId)` for explicit actions.
- Cache key should include `contestId` and `roundId` to avoid cross-contest bleed.

This can be implemented using a simple in-memory cache in the provider or by adopting a data library later. The UX should never block on background refresh.

## 5. Round UI component plan
### `RoundCard` (presentational)
- Props: `round`, `variant`, `onClick`
- Variants:
  - `compact` (bracket + admin list): round name + contestant names
  - `detailed` (vote page header): round name + status + matchup count
- Visual: small title, contestant list, status badge
- No data fetching inside; uses prop-only data.

### `RoundHeader` (presentational)
- Used on vote page
- Shows current round, contest name, and optional action buttons

Round components should live under a shared UI library (per standards), e.g. shared mixology UI folder.

## 6. Drink UI component plan
### `DrinkCard` (presentational)
- Props: `drink`, `showCreator`, `showActions`, `variant`
- Variants:
  - `compact` (list items, admin quick view)
  - `vote` (includes vote totals and category scores)
- Handles unnamed drinks gracefully (shows “Unnamed Drink” or prompt).

### `DrinkNameInline` (editable display)
- Props: `drinkId`, `name`, `onSave`
- Used by admin and users (if permitted) to name drinks.

`RoundCard` should accept a `DrinkCard`-ready data array and render it by mapping; do not use slots.

## 7. Vote UI plan (flexible categories)
### `VoteCategoryTabs` (scrollable)
- Accepts 0..N categories; handles no-categories state gracefully.
- Horizontal scroll for overflow, keyboard accessible.

### `VoteScorePanel`
- Shows list of drinks and totals for current category.
- Renders `DrinkCard` in `vote` variant with category score details.

### Empty & edge states
- 0 categories: show “No categories yet” and allow admin to add.
- 0 drinks: show “No drinks submitted yet.”
- Missing names: show “Unnamed Drink” with rename affordance.

## 8. Page-level usage plan
### Bracket page
- Display `RoundCard` in `compact` variant.
- Include contestant names; minimal vote data.
- Clicking current round navigates to vote page.

### Vote page
- Use `RoundHeader` + `DrinkCard` in `vote` variant.
- Show category tabs + totals, user score inputs, and overall totals.
- Support naming drinks inline when allowed.

### Admin pages
- Show `RoundCard` list for management.
- Display editable category list; add/remove categories.
- Provide vote totals by category with admin-only controls.

## 9. Backend integration plan (contracts)
We need stable endpoints/functions that map cleanly to UI:

### Round/contest data
- `getContestOverview()` → contest info + rounds list
- `getRoundDetail(roundId)` → matchups, drinks, category list

### Votes
- `getVoteTotals(roundId)` → per drink totals per category
- `submitVote(roundId, categoryId, drinkId, value)`

### Admin tools
- `createCategory(roundId, label)`
- `deleteCategory(roundId, categoryId)`
- `setActiveRound(roundId)`
- `renameDrink(drinkId, name)`

These functions should map to Firebase/Firestore or server routes behind a provider abstraction. UI should not call raw Firebase directly.

## 10. Implementation order (architecture-first)
1. ✅ Define UI types and data mapping layer in a mixology data module.
2. 🟡 Create `MixologyDataProvider` with cached fetch + refresh APIs (focus + interval refresh + stale-while-revalidate cache in place).
3. 🟡 Build `RoundCard` + `DrinkCard` presentational components (implemented + assumption tests).
4. Build vote UI (category tabs + score panel) with mock data.
5. Wire pages to context data (bracket, vote, admin).
6. Integrate real backend functions behind provider interface.

### Current status notes
- UI-facing types and mapping helpers are implemented.
- `MixologyDataProvider` exists and exposes contest/round/drink snapshots with `refreshAll()`.
- Refresh strategy includes focus + interval revalidation and `refreshRound()` (currently delegates to full refresh).
- Stale-while-revalidate cache is implemented for current contest snapshot (tests added).
- Mixology layout is now wrapped in `MixologyDataProvider`.
- Next: add round-specific refresh/cache if needed and start building `RoundCard`/`DrinkCard` components.
- `RoundCard` and `DrinkCard` are implemented with assumption tests.
- Next: start wiring components into bracket/vote/admin pages and add vote UI pieces.

## 11. Notes / alignment
- This aligns with the UX Plan’s provider architecture and component inventory.
- Component size, styling, and theme usage should follow Dev Standards.
- Implementation correctness and flexibility is higher priority than speed. We will iterate until it works.
