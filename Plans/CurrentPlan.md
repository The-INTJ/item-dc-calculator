# Plan: Simplify Voting System with Firestore-Native Patterns

> **Goal**: Replace the custom `scoreLock` system and dual-write pattern with proper Firestore transactions and a per-user votes subcollection. Each phase is independently shippable.

---

## Phase 1 — Dead Code & Dual-Write Removal

Remove unused code and eliminate the write-only `votes` collection path.

### Steps

1. **Delete `useSubmitVotes.ts`** — zero call-site usages. Fix the `SubmitStatus` type import in `VoteActions.tsx` to import from `useRoundVoting` instead.
   - Delete: `src/features/contest/lib/hooks/useSubmitVotes.ts`
   - Edit: `src/features/contest/components/votePage/VoteActions.tsx` (update import)

2. **Delete `useVoteScores.ts`** — zero call-site usages.
   - Delete: `src/features/contest/lib/hooks/useVoteScores.ts`

3. **Delete `useVoting.ts`** — writes to flat `votes` collection which is never read by anything.
   - Delete: `src/features/contest/contexts/contest/hooks/useVoting.ts`

4. **Remove `useVoting` from ContestContext** — remove import, hook call, and `...voting` spread from the context value.
   - Edit: `src/features/contest/contexts/contest/ContestContext.tsx`
   - Edit: `src/features/contest/contexts/contest/contestTypes.ts` (remove `VotingActions`, `Vote`, `VoteInput` types)

5. **Remove `recordVote()` calls from `useRoundVoting`** — eliminates the second write leg of the dual-write. The API `POST /scores` is now the sole write path.
   - Edit: `src/features/contest/lib/hooks/useRoundVoting.ts` (remove `recordVote` usage, ~L99-L107)

6. **Remove `scoreByUser` and `scoreTotals` from Entry type** — these are written by `applyEntryScoreUpdate` but never read by any UI component.
   - Edit: `src/features/contest/contexts/contest/contestTypes.ts` (remove fields from `Entry`)
   - Edit: `src/features/contest/lib/firebase/scoring/scoreTransaction.ts` (remove `applyEntryScoreUpdate` logic that writes these fields)

7. **Remove `buildScoresFromVotes`** — confirmed zero call-site usages.
   - Edit: `src/features/contest/lib/helpers/scoreUtils.ts`

### Verification
- `npm run type-check` passes
- No references to deleted symbols remain
- VoteModal still submits scores via the single API path
- Score display in BracketView and ContestDetails unchanged

---

## Phase 2 — Replace Custom Lock with Firestore Transaction

The custom lock system (`scoreLock` with exponential backoff, TTL, lock tokens) is unnecessary — Firestore transactions already retry automatically on contention.

### Steps

8. **Delete `scoreLock.ts` entirely** — removes `ScoreLockError`, `buildLockBackoff`, `releaseEntryScoreLock`, and all lock constants.
   - Delete: `src/features/contest/lib/firebase/scoring/scoreLock.ts`

9. **Remove `scoreLock` from Entry type**.
   - Edit: `src/features/contest/contexts/contest/contestTypes.ts` (remove `scoreLock?` field)

10. **Simplify `updateEntryScoresWithLock()` → rename to `updateEntryScores()`**. Remove: lock token generation, lock checking, backoff-retry loop, lock release call. Keep the `runTransaction` — Firestore handles retries natively.
    - Edit: `src/features/contest/lib/firebase/scoring/scoreTransaction.ts`

11. **Simplify `submit()` and `update()` in scoresProvider** — remove `lockToken` parameter threading, `generateId('score-lock')` call, and lock-related logic. They call the simplified `updateEntryScores()` directly.
    - Edit: `src/features/contest/lib/firebase/providers/scoresProvider.ts`

12. **Fix hardcoded mixology attributes in `createEmptyBreakdown()`** — make it config-driven by accepting an attribute list as a parameter.
    - Edit: `src/features/contest/lib/firebase/scoring/breakdownUtils.ts`

### Verification
- Score submission works under simulated concurrent writes (two browser tabs voting simultaneously)
- No `scoreLock` references remain in the codebase
- `npm run type-check` passes

---

## Phase 3 — Migrate to Votes Subcollection (Source of Truth)

Core data model change per the ideation doc. Per-user vote documents become the authoritative record.

### Data Model

New Firestore subcollection: **`contests/{contestId}/votes/{judgeId}_{entryId}`**

```typescript
// Vote document schema
{
  judgeId: string;           // Firebase UID of the voter
  entryId: string;           // Which entry was voted on
  round: string;             // Round ID
  breakdown: ScoreBreakdown; // Per-attribute scores { [attrId]: number | null }
  notes?: string;            // Judge notes
  naSections?: string[];     // Attributes marked N/A
  createdAt: Timestamp;      // Firestore serverTimestamp()
  updatedAt: Timestamp;      // Firestore serverTimestamp()
}
```

**Document ID = `{judgeId}_{entryId}`** — guarantees one vote per judge per entry at the Firestore level. No query-based dedup needed.

### Steps

13. **Create a `votesProvider`** (or adapt `scoresProvider`) that reads/writes from the `contests/{contestId}/votes` subcollection instead of the `scores[]` array. Use `setDoc` with merge for upserts — first vote and revote use the same code path.
    - New/Edit: `src/features/contest/lib/firebase/providers/scoresProvider.ts`

14. **Update `POST /api/contest/contests/:id/scores`** route handler to write to the votes subcollection via the new provider.
    - Edit: `app/api/contest/contests/[id]/scores/route.ts`

15. **Update `GET /api/contest/contests/:id/scores`** to query the votes subcollection (with optional `?entryId` / `?judgeId` / `?round` filters).
    - Edit: `app/api/contest/contests/[id]/scores/route.ts`

16. **Remove the `scores[]` array from the contest document**. Update the `Contest` type.
    - Edit: `src/features/contest/contexts/contest/contestTypes.ts`

17. **Update `GET /api/contest/contests/:id`** to populate a `scores` field by querying the votes subcollection, so downstream consumers (BracketView, VoteModal, ContestDetails) don't need to change their read pattern.
    - Edit: `app/api/contest/contests/[id]/route.ts`

18. **Update score utility functions** — `getEntryScore()` and `buildTotalsFromScores()` to work with scores from the subcollection (passed as a flat array from the API, same shape as before).
    - Edit: `src/features/contest/lib/helpers/contestGetters.ts`
    - Edit: `src/features/contest/lib/helpers/scoreUtils.ts`

19. **Pre-fill previous votes in VoteModal** — Update `useRoundVoting` to fetch the current user's existing votes for the round via `GET /api/contest/contests/:id/scores?judgeId={userId}` and use them as initial slider values instead of defaulting to 5.
    - Edit: `src/features/contest/lib/hooks/useRoundVoting.ts`

### Verification
- `GET /api/contest/contests/:id/scores` returns data from the subcollection
- VoteModal pre-fills previous votes when reopened
- Admin ContestDetails still shows per-judge breakdowns
- BracketView scores match expected averages
- No `scores[]` array in contest documents

---

## Phase 4 — Entry Aggregates for Efficient Bracket Reads

Add denormalized aggregates on entries so the bracket view doesn't need to fetch all vote docs.

### Data Model Addition

New fields on `Entry` (inside the contest document):

```typescript
{
  sumScore: number;   // Sum of all vote totals for this entry
  voteCount: number;  // Number of distinct voters
}
```

### Steps

20. **Add `sumScore` and `voteCount` to Entry type**.
    - Edit: `src/features/contest/contexts/contest/contestTypes.ts`

21. **Update the vote write path** to use a Firestore transaction that:
    - Reads the user's existing vote doc from the subcollection (if any)
    - Computes a delta: `newTotal − oldTotal` (or full value if first vote)
    - Writes the new vote doc to the subcollection
    - Atomically increments `entry.sumScore` (by delta) and `entry.voteCount` (by 1 on first vote, 0 on revote) in the contest document
    - Edit: `src/features/contest/lib/firebase/providers/scoresProvider.ts`

22. **Update `getEntryScore()`** to compute from `entry.sumScore / entry.voteCount` instead of iterating all scores. This eliminates the need to fetch all vote docs for the bracket view.
    - Edit: `src/features/contest/lib/helpers/contestGetters.ts`

23. **Detailed per-judge breakdown** (admin view, VoteModal totals) still queries the votes subcollection when needed — aggregates are only for the common bracket fast path.

### Verification
- BracketView scores match expected averages computed from aggregates
- Score submission atomically updates both the vote doc and entry aggregates
- Two users voting simultaneously produce correct aggregates (Firestore transaction retries handle contention)

---

## Phase 5 — Real-Time Listeners (Later Phase)

Add Firestore `onSnapshot` listeners for live score updates.

### Steps

24. **Contest document listener** — subscribe to the contest document for entry aggregate updates. BracketView scores update in real time as votes come in.

25. **Votes subcollection listener** — subscribe (filtered by round) for live per-category totals in VoteModal.

26. **Optional display pacing** — buffer incoming snapshots in state and commit to the rendered leaderboard on a timer for a "live but paced" experience (per ideation doc).

### Verification
- Opening a contest page shows bracket scores updating in real time as another user votes
- VoteModal shows live aggregate totals updating without manual refresh

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Votes subcollection over top-level collection** | `contests/{id}/votes/{docId}` scopes votes to their contest, enables efficient queries, simplifies security rules |
| **Document ID as `{judgeId}_{entryId}`** | Guarantees uniqueness at the Firestore level — no query-based dedup needed |
| **Keep entries in contest doc** | Moving entries to a subcollection would be disruptive with minimal benefit at current scale. Aggregates on entry objects are sufficient |
| **API populates scores on GET** | `GET /contests/:id` assembles scores from the subcollection into the response, minimizing downstream UI changes in Phase 3 |
| **Phase ordering** | Phase 1–2 are quick wins for immediate simplification. Phase 3–4 is the core migration. Phase 5 is additive |
| **`setDoc` with merge for upserts** | First votes and revotes use the same code path — no conditional add/update logic |

## Current Codebase Reference

Key files affected across all phases:

| File | Phases | Role |
|---|---|---|
| `contexts/contest/contestTypes.ts` | 1, 2, 3, 4 | Type definitions (Entry, ScoreEntry, Vote, etc.) |
| `contexts/contest/ContestContext.tsx` | 1 | Provider — remove useVoting wiring |
| `contexts/contest/hooks/useVoting.ts` | 1 | **Delete** — dual-write to votes collection |
| `lib/hooks/useRoundVoting.ts` | 1, 3 | Vote submission hook — simplify, add pre-fill |
| `lib/hooks/useSubmitVotes.ts` | 1 | **Delete** — dead code |
| `lib/hooks/useVoteScores.ts` | 1 | **Delete** — dead code |
| `lib/firebase/scoring/scoreLock.ts` | 2 | **Delete** — custom lock system |
| `lib/firebase/scoring/scoreTransaction.ts` | 2 | Simplify — remove lock, keep transaction |
| `lib/firebase/scoring/breakdownUtils.ts` | 2 | Fix hardcoded mixology attributes |
| `lib/firebase/providers/scoresProvider.ts` | 2, 3, 4 | Core rewrite — subcollection + aggregates |
| `app/api/contest/contests/[id]/scores/route.ts` | 3 | Route handler — read/write subcollection |
| `app/api/contest/contests/[id]/route.ts` | 3 | Populate scores on GET |
| `lib/helpers/contestGetters.ts` | 3, 4 | `getEntryScore()` — use aggregates |
| `lib/helpers/scoreUtils.ts` | 1, 3 | Remove dead code, update utilities |
| `components/votePage/VoteActions.tsx` | 1 | Fix type import |
