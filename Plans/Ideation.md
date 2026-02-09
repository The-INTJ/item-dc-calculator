## Goal

Support concurrent voting on a shared “thing” (e.g., drink) with:

* correct aggregation under simultaneous multi-user updates
* support for vote changes without corrupting totals
* a leaderboard view derived from aggregates
* real-time UI updates via Firestore listeners (optionally rendered on a timer)

## Core strategy

Use a **per-user vote record as the source of truth** and maintain **aggregate counters** on the shared item using Firestore’s **atomic numeric increments**. When a user changes their vote, compute a **delta** from their previously stored vote and only apply that delta to aggregates (no “locking” required for multi-user concurrency).

## Data model

### 1) Item document (shared, many writers)

Each item stores only aggregation-friendly fields:

* `sumScore`: numeric total of all vote values
* `voteCount`: numeric count of distinct voters counted
* optional leaderboard-friendly fields depending on ranking approach (see Leaderboard section)
* round/state fields if voting is time-bounded (e.g., “open/closed”, timestamps)

### 2) Per-user vote document (single writer)

For each item (and round if applicable), store a vote doc keyed by user:

* `value`: the user’s current vote value (e.g., 1–10)
* metadata: timestamps, round id, etc.

This doc is written only by that user, eliminating cross-user contention for “what did this user vote previously?”

## Write path behavior

### A) First-time vote

1. Create the user’s vote doc for that item.
2. Apply atomic increments to the item doc:

   * add `value` to `sumScore`
   * add `1` to `voteCount`

### B) Vote change (revote)

1. Read the user’s existing vote value.
2. Compute `delta = newValue - oldValue`.
3. Update the user’s vote doc to `newValue`.
4. Apply atomic increment to the item doc:

   * add `delta` to `sumScore`
   * do **not** change `voteCount`

This ensures vote edits adjust the aggregate without affecting the divisor.

### C) Vote removal (only if you support it)

1. Read the user’s existing vote.
2. Delete (or mark removed) the user vote doc.
3. Apply atomic increments to the item doc:

   * subtract `oldValue` from `sumScore`
   * subtract `1` from `voteCount`

## Concurrency and integrity assumptions

### Multi-user concurrency (the main problem)

* Firestore’s atomic increments handle simultaneous updates to `sumScore` / `voteCount` correctly across many users.

### Same-user concurrency (explicitly non-MVP)

* The design assumes one active client per user and no overlapping writes from the same user.
* For MVP, accept this assumption.
* If/when you expand beyond MVP, move the “read old value → compute delta → update vote → increment aggregates” into a single atomic unit (transaction or server-side aggregator) to prevent same-user races and double-apply scenarios.

## Real-time UI strategy (listener-based)

### Live updates

* Subscribe to item documents (or a round’s item collection) with Firestore listeners.
* The UI derives current score from `sumScore / voteCount` (and formats to “/10”).

### Optional “update cadence” UX

If you want results to “tick” on a cadence rather than update every single vote:

* still keep listeners active so state is always current
* buffer incoming snapshots in state, and only commit them to the rendered leaderboard on a timer

This gives a “live but paced” experience without polling or sacrificing correctness.

## Leaderboard strategy

### Ranking field

Decide what “leaderboard” means:

* ranking by average (`sumScore / voteCount`) is typical
* ranking by total score favors popularity
* ranking by count favors participation

Firestore queries cannot sort by a computed expression, so either:

* compute ranks client-side from the listened docs (common for small/medium item counts), or
* store a rankable field (e.g., `avgScore`) that you maintain alongside aggregates.

For MVP, the simplest robust approach is:

* listen to the set of item docs for the round
* compute `avg = sumScore / voteCount` in the UI
* sort in memory and render leaderboard

(If item count becomes large or you need server-side pagination/ranking, revisit storing a rankable field or maintaining leaderboard materializations.)

## Round lifecycle (if voting is time-bounded)

### Open/close control

* Represent round state in a single “round” doc (or config) and/or on each item.
* During “open”, votes are accepted.
* At “close”, stop accepting vote writes and optionally snapshot results.

### Snapshot/finalization

At round end, optionally persist:

* final aggregates per item (already stored)
* final leaderboard ordering (optional)
* any “winners” metadata

## Validation and rules (high level guidance for the agent)

* Enforce vote bounds (1–10).
* Ensure only the user can write their vote doc.
* Ensure votes are only accepted while the round is open.
* Consider the trust model:

  * MVP may accept client-side aggregate updates
  * if cheating resistance matters later, shift aggregate maintenance to a trusted backend path (derive aggregates from vote docs)

## Summary of the strategy

* Per-user vote docs are the authoritative record.
* Aggregates on items are maintained via atomic increments:

  * first vote increments both total score and voter count
  * revote increments only by the delta and does not touch voter count
* UI stays real-time by listening to item docs; optional timer controls display cadence without polling.
