# Plan: Simplify Voting System with Firestore-Native Patterns

> **Goal**: Replace the custom `scoreLock` system and dual-write pattern with proper Firestore transactions and a per-user votes subcollection. Each phase is independently shippable.

---

## Phase 1 — Dead Code & Dual-Write Removal

✅ Completed

---

## Phase 2 — Replace Custom Lock with Firestore Transaction

✅ Completed

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

Key files affected across remaining phases:

| File | Phases | Role |
|---|---|---|
| `contexts/contest/contestTypes.ts` | 3, 4 | Type definitions (Entry, ScoreEntry, Vote, etc.) |
| `lib/hooks/useRoundVoting.ts` | 3 | Vote submission hook — add pre-fill |
| `lib/firebase/scoring/scoreTransaction.ts` | 3, 4 | Transaction helper for score writes |
| `lib/firebase/scoring/breakdownUtils.ts` | 3, 4 | Score breakdown helpers |
| `lib/firebase/providers/scoresProvider.ts` | 3, 4 | Core rewrite — subcollection + aggregates |
| `app/api/contest/contests/[id]/scores/route.ts` | 3 | Route handler — read/write subcollection |
| `app/api/contest/contests/[id]/route.ts` | 3 | Populate scores on GET |
| `lib/helpers/contestGetters.ts` | 3, 4 | `getEntryScore()` — use aggregates |
| `lib/helpers/scoreUtils.ts` | 3 | Update utilities |
