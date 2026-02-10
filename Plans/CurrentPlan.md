# Plan: Simplify Voting System with Firestore-Native Patterns

> **Goal**: Replace the custom `scoreLock` system and dual-write pattern with proper Firestore transactions and a per-user votes subcollection. Each phase is independently shippable.

## Current Status

- ✅ **Phase 1** — Dead Code & Dual-Write Removal (Completed)
- ✅ **Phase 2** — Replace Custom Lock with Firestore Transaction (Completed)
- ✅ **Phase 3** — Migrate to Votes Subcollection (Completed)
- ✅ **Phase 4** — Entry Aggregates for Efficient Bracket Reads (Completed)
- ✅ **Phase 4.5** — Code Quality & Terminology Cleanup (Completed)
- 🔲 **Phase 5** — Real-Time Listeners (Future)

---

## Phase 1 — Dead Code & Dual-Write Removal

✅ Completed

---

## Phase 2 — Replace Custom Lock with Firestore Transaction

✅ Completed

---

## Phase 3 — Migrate to Votes Subcollection (Source of Truth)

✅ **Completed**

Core data model change per the ideation doc. Per-user vote documents are now the authoritative record.

### Data Model

Firestore subcollection: **`contests/{contestId}/votes/{userId}_{entryId}`**

```typescript
// Vote document schema
{
  userId: string;            // Firebase UID of the voter
  entryId: string;           // Which entry was voted on
  round: string;             // Round ID
  breakdown: ScoreBreakdown; // Per-attribute scores { [attrId]: number }
  notes?: string;            // Judge notes
  createdAt: Timestamp;      // Firestore serverTimestamp()
  updatedAt: Timestamp;      // Firestore serverTimestamp()
}
```

**Document ID = `{userId}_{entryId}`** — guarantees one vote per user per entry at the Firestore level.

### Completed Steps

✅ 13. **Created scoresProvider using votes subcollection** — Uses `setDoc` with merge for upserts, same code path for new votes and revotes.
    - `src/features/contest/lib/firebase/providers/scoresProvider.ts`

✅ 14. **Updated POST route** — Writes to votes subcollection via provider, handles both new and existing votes.
    - `app/api/contest/contests/[id]/scores/route.ts`

✅ 15. **Updated GET route** — Queries votes subcollection with `?entryId` / `?userId` filters.
    - `app/api/contest/contests/[id]/scores/route.ts`

✅ 16. **Removed scores[] array from Contest type** — TypeScript types no longer include a scores array.
    - `src/features/contest/contexts/contest/contestTypes.ts`

⚠️ 17. **Skipped** — Not needed because Phase 4 entry aggregates (`sumScore`, `voteCount`) eliminated the need for downstream consumers to access a full scores array.

✅ 18. **Updated score utility functions** — `getEntryScore()` uses entry aggregates, `scoreUtils.ts` works with breakdown objects.
    - `src/features/contest/lib/helpers/contestGetters.ts`
    - `src/features/contest/lib/helpers/scoreUtils.ts`

✅ 19. **Vote pre-filling in VoteModal** — `useRoundVoting` fetches user's existing votes via API and pre-fills sliders.
    - `src/features/contest/lib/hooks/useRoundVoting.ts`
    - ⚠️ Note: Introduced direct fetch call instead of using API surface (fixed in Phase 4.5)

### Verification ✅
- `GET /api/contest/contests/:id/scores` returns data from subcollection
- VoteModal pre-fills previous votes when reopened
- Admin views can query per-judge breakdowns
- BracketView scores compute from entry aggregates
- No `scores[]` array in TypeScript types

---

## Phase 4 — Entry Aggregates for Efficient Bracket Reads

✅ **Completed**

Denormalized aggregates on entries so the bracket view doesn't need to fetch all vote docs.

### Data Model Addition

Fields on `Entry` (inside the contest document):

```typescript
{
  sumScore: number;   // Sum of all vote totals for this entry
  voteCount: number;  // Number of distinct voters
}
```

### Completed Steps

✅ 20. **Added `sumScore` and `voteCount` to Entry type** — TypeScript interface includes aggregates.
    - `src/features/contest/contexts/contest/contestTypes.ts`

✅ 21. **Updated vote write path with transaction** — `submit()`, `update()`, and `delete()` methods in scoresProvider:
    - Read existing vote doc and contest doc
    - Compute delta: `newTotal − oldTotal`
    - Write vote doc to subcollection
    - Atomically update `entry.sumScore` (by delta) and `entry.voteCount` (increment on first vote)
    - All within a single Firestore transaction
    - `src/features/contest/lib/firebase/providers/scoresProvider.ts`

✅ 22. **Updated `getEntryScore()`** — Computes from `entry.sumScore / entry.voteCount`, no iteration over scores needed.
    - `src/features/contest/lib/helpers/contestGetters.ts`

✅ 23. **Detailed per-judge breakdown** — Admin views and VoteModal query votes subcollection when needed via the GET `/api/contest/contests/:id/scores` endpoint with filters.

### Verification ✅
- BracketView scores compute from entry aggregates (fast reads)
- Score submission atomically updates vote doc + entry aggregates
- Transaction retries handle concurrent votes correctly
- Per-judge breakdowns available via API queries

---

## Phase 4.5 — Code Quality & Terminology Cleanup

✅ **Completed**

Cleaned up technical debt: added scores API surface to contestApi, replaced direct fetch in useRoundVoting, renamed "viewer" role to "competitor", updated OpenAPI schema to match votes subcollection + entry aggregates data model with consistent user/voter terminology.

---

## Phase 5 — Real-Time Listeners (Later Phase)

Add Firestore `onSnapshot` listeners for live score updates.

### Steps

25. **Contest document listener** — subscribe to the contest document for entry aggregate updates. BracketView scores update in real time as votes come in.

26. **Votes subcollection listener** — subscribe (filtered by round) for live per-category totals in VoteModal.

27. **Optional display pacing** — buffer incoming snapshots in state and commit to the rendered leaderboard on a timer for a "live but paced" experience (per ideation doc).

### Verification
- Opening a contest page shows bracket scores updating in real time as another user votes
- VoteModal shows live aggregate totals updating without manual refresh

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Votes subcollection over top-level collection** | `contests/{id}/votes/{docId}` scopes votes to their contest, enables efficient queries, simplifies security rules |
| **Document ID as `{userId}_{entryId}`** | Guarantees uniqueness at the Firestore level — no query-based dedup needed |
| **Keep entries in contest doc** | Moving entries to a subcollection would be disruptive with minimal benefit at current scale. Aggregates on entry objects are sufficient |
| **API populates scores on GET** | Phase 3 originally planned for `GET /contests/:id` to assemble scores — Phase 4 eliminated this need via entry aggregates |
| **Phase ordering** | Phase 1–2 are quick wins for immediate simplification. Phase 3–4 is the core migration. Phase 4.5 cleans up technical debt. Phase 5 is additive |
| **`setDoc` with merge for upserts** | First votes and revotes use the same code path — no conditional add/update logic |
| **"competitor" role over "viewer"** | Competitors are active participants who vote. "viewer" implied read-only access that doesn't exist. Future: competitors auto-vote themselves 100% |
| **contestApi/adminApi surfaces** | Centralized API methods with auth handling — no direct fetch calls in components/hooks |

## Current Codebase Reference

Key files in the implemented solution:

| File | Status | Role |
|---|---|---|
| `contexts/contest/contestTypes.ts` | ✅ Complete | Type definitions: Entry aggregates, UserRole = admin/voter/competitor |
| `lib/hooks/useRoundVoting.ts` | ✅ Complete | Vote submission hook; uses contestApi surface |
| `lib/api/contestApi.ts` | ✅ Complete | Client API surface with scores methods |
| `lib/api/serverAuth.ts` | ✅ Complete | Server auth; USER_ROLES = admin/voter/competitor, default fallback = voter |
| `lib/firebase/providers/scoresProvider.ts` | ✅ Complete | Core provider — votes subcollection with transaction-based aggregate updates |
| `app/api/contest/contests/[id]/scores/route.ts` | ✅ Complete | Route handler — read/write votes subcollection with filters |
| `app/api/contest/contests/[id]/route.ts` | ✅ Complete | Returns contest document (no score population needed) |
| `lib/helpers/contestGetters.ts` | ✅ Complete | `getEntryScore()` computes from entry aggregates |
| `lib/helpers/scoreUtils.ts` | ✅ Complete | Score breakdown utilities (no iteration over scores) |
| `app/api/contest/openapi.json` | ✅ Complete | Updated: voter/user terminology, votes subcollection, entry aggregates |
