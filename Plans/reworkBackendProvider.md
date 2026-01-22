# Rework Backend Provider Plan

This document outlines the refactoring plan for `firebaseBackendProvider.ts` (~728 lines), which violates the DEV_STANDARDS.md guideline of keeping important logic under ~80-100 lines per file.

---

## Progress

- ✅ Phase 1 completed (file split and provider utilities extraction).
- ✅ Phase 2.2 completed (removed deprecated `drinks`/`listByDrink` provider usage).
- ⬜ Remaining Phase 2 items pending.

---

## Questions Answered

### 1. Why are we manually building `success`/`error` results?

The `ProviderResult<T>` pattern is a custom discriminated union that wraps both success and failure cases. This is intentional for consistency across providers, but the helper functions `success()` and `error()` are duplicated in both `firebaseBackendProvider.ts` and `inMemoryProvider.ts`.

**Recommendation:** Extract `success()` and `error()` helpers to a shared utility file so both providers import them.

### 2. Why does `constructor() super` appear? (It doesn't)

Looking at the file, there is no class with `constructor()` or `super()`. The `ScoreLockError` extends `Error`, which uses `super()` in the constructor—this is the standard modern JavaScript/TypeScript pattern for custom errors and is not outdated React. This is fine.

### 3. Why are breakdown utilities in the provider?

`createEmptyBreakdown`, `addBreakdowns`, `diffBreakdowns`, and `applyEntryScoreUpdate` are pure utility functions that manipulate `ScoreBreakdown` objects. They have no Firebase-specific logic and should live in a shared utils file.

### 4. Why is `updateEntryScoresWithLock` so complex?

This function mixes:
- Firestore transaction mechanics (db access, document refs)
- Retry/backoff logic for lock contention
- Business logic for score updates

It takes `db`, `contestId`, `entryId`, `lockToken`, and a callback—too many concerns in one place. The score update logic shouldn't need to know about the database directly.

### 5. Why are the CRUD providers so repetitive?

`createFirebaseContestsProvider`, `createFirebaseEntriesProvider`, `createFirebaseJudgesProvider`, and `createFirebaseScoresProvider` all follow nearly identical patterns:
- Get contest document
- Find item in array
- Update array
- Write back to Firestore

This is textbook duplication that can be abstracted into a generic "array-backed entity" helper.

---

## Current Problems

1. **728 lines in one file** — impossible to hold in working memory
2. **Duplicated CRUD boilerplate** — same pattern repeated 4 times
3. **Utility functions mixed with provider logic** — breakdown math, ID generation, result wrappers
4. **Score locking logic tightly coupled to Firestore** — can't test without mocking Firestore
5. **No separation between data access and business logic**
6. **Duplicated helpers across files** — `success()`, `error()`, `generateId()` exist in both providers

---

## Target Architecture

```
src/features/mixology/server/
├── backend/
│   ├── types.ts                    # (exists) Provider interfaces
│   ├── inMemoryProvider.ts         # (exists) In-memory implementation
│   └── providerUtils.ts            # (NEW) Shared: success(), error(), generateId()
│
├── firebase/
│   ├── config.ts                   # (exists) Firebase initialization
│   ├── index.ts                    # (exists) Exports
│   ├── firebaseAuthProvider.ts     # (exists) Auth provider
│   ├── guest.ts                    # (exists) Guest identity
│   │
│   ├── firebaseBackendProvider.ts  # (SLIM) Entry point only - ~40 lines
│   ├── firestoreAdapter.ts         # (NEW) Low-level Firestore access + transactions
│   ├── arrayEntityAdapter.ts       # (NEW) Generic CRUD for array-backed entities
│   │
│   ├── providers/                  # (NEW FOLDER)
│   │   ├── contestsProvider.ts     # ~60-80 lines
│   │   ├── entriesProvider.ts      # ~50-60 lines
│   │   ├── judgesProvider.ts       # ~50-60 lines
│   │   └── scoresProvider.ts       # ~80-100 lines (most complex)
│   │
│   └── scoring/                    # (NEW FOLDER)
│       ├── breakdownUtils.ts       # Pure functions: add, diff, empty breakdown
│       ├── scoreLock.ts            # Lock acquisition, release, backoff logic
│       └── scoreTransaction.ts     # Orchestrates locked score updates
```

---

## Phase 1: Split the File (No External Changes)

This phase only reorganizes `firebaseBackendProvider.ts` into smaller files. All exports remain compatible—no changes to consumers.

### Step 1.1: Extract shared utilities to `backend/providerUtils.ts`

Move from both `firebaseBackendProvider.ts` and `inMemoryProvider.ts`:
- `generateId(prefix: string): string`
- `success<T>(data: T): ProviderResult<T>`
- `error<T>(message: string): ProviderResult<T>`

Both providers import from the shared location.

### Step 1.2: Extract breakdown utilities to `firebase/scoring/breakdownUtils.ts`

Move:
- `createEmptyBreakdown(): ScoreBreakdown`
- `addBreakdowns(base, delta): ScoreBreakdown`
- `diffBreakdowns(next, prev): ScoreBreakdown`

### Step 1.3: Extract score locking to `firebase/scoring/scoreLock.ts`

Move:
- `ScoreLockError` class
- `SCORE_LOCK_*` constants
- `buildLockBackoff(attempt): number`
- `releaseEntryScoreLock(db, contestId, entryId, lockToken)`

### Step 1.4: Extract score transaction to `firebase/scoring/scoreTransaction.ts`

Move:
- `applyEntryScoreUpdate(entry, judgeId, breakdown, lockToken, now): Entry`
- `updateEntryScoresWithLock({ db, contestId, entryId, lockToken, onUpdate })`

This file imports from `breakdownUtils.ts` and `scoreLock.ts`.

### Step 1.5: Extract Firestore adapter to `firebase/firestoreAdapter.ts`

Create a thin wrapper that provides:
```typescript
interface FirestoreAdapter {
  getContest(contestId: string): Promise<Contest | null>;
  updateContest(contestId: string, updates: Partial<Contest>): Promise<void>;
  runContestTransaction<T>(
    contestId: string,
    callback: (contest: Contest, transaction: Transaction) => T
  ): Promise<T>;
}
```

This isolates Firestore-specific imports and provides a testable abstraction.

### Step 1.6: Extract array entity adapter to `firebase/arrayEntityAdapter.ts`

Create a generic helper for array-backed entities:
```typescript
function createArrayEntityProvider<T extends { id: string }>(
  adapter: FirestoreAdapter,
  getArray: (contest: Contest) => T[],
  setArray: (contest: Contest, items: T[]) => Partial<Contest>,
  entityName: string
): {
  list(contestId: string): Promise<ProviderResult<T[]>>;
  getById(contestId: string, id: string): Promise<ProviderResult<T | null>>;
  create(contestId: string, input: Omit<T, 'id'>): Promise<ProviderResult<T>>;
  update(contestId: string, id: string, updates: Partial<T>): Promise<ProviderResult<T>>;
  delete(contestId: string, id: string): Promise<ProviderResult<void>>;
}
```

### Step 1.7: Create individual provider files

**`firebase/providers/contestsProvider.ts`** (~60 lines)
- Uses `firestoreAdapter` directly since contests are top-level docs
- Implements `ContestsProvider`

**`firebase/providers/entriesProvider.ts`** (~30 lines)
- Uses `arrayEntityAdapter` with `contest.entries`
- Implements `EntriesProvider`

**`firebase/providers/judgesProvider.ts`** (~30 lines)
- Uses `arrayEntityAdapter` with `contest.judges`
- Implements `JudgesProvider`

**`firebase/providers/scoresProvider.ts`** (~80 lines)
- Uses `arrayEntityAdapter` for basic CRUD
- Uses `scoreTransaction.ts` for `submit()` and `update()` with locking
- Implements `ScoresProvider`

### Step 1.8: Slim down `firebaseBackendProvider.ts`

The main file becomes ~40 lines:
```typescript
export function createFirebaseBackendProvider(): MixologyBackendProvider {
  let db: Firestore | null = null;
  const getDb = () => db;
  const adapter = createFirestoreAdapter(getDb);

  const entriesProvider = createFirebaseEntriesProvider(adapter);

  return {
    name: 'firebase',
    contests: createFirebaseContestsProvider(adapter),
    entries: entriesProvider,
    judges: createFirebaseJudgesProvider(adapter),
    scores: createFirebaseScoresProvider(adapter),

    async initialize(): Promise<ProviderResult<void>> { /* ... */ },
    async dispose(): Promise<void> { /* ... */ },
  };
}
```

---

## Phase 2: Improve Abstractions (May Require External Changes)

This phase introduces cleaner separation of concerns. Some API routes or consumers may need minor updates.

### Step 2.1: Abstract database context

Currently, `updateEntryScoresWithLock` takes `db: Firestore` directly. After Phase 1, it takes `adapter: FirestoreAdapter`. In Phase 2, we can:

1. Make the adapter a singleton initialized once
2. Have providers receive the adapter via dependency injection
3. Remove `getDb()` closures in favor of direct adapter usage

**Impact:** No external changes—internal refactor only.

### Step 2.2: Remove deprecated `drinks` alias

The `drinks` property on `MixologyBackendProvider` and `listByDrink` on `ScoresProvider` are deprecated aliases.

**Impact:** 
- Search codebase for `.drinks` and `.listByDrink` usages
- Update consumers to use `.entries` and `.listByEntry`
- Remove deprecated properties from types and implementations

**Estimated scope:** ~5-10 files may reference these.

### Step 2.3: Consolidate in-memory provider with same structure

Apply the same architecture to `inMemoryProvider.ts`:
- Use `providerUtils.ts` for shared helpers
- Use similar provider/adapter structure for consistency
- This makes testing and swapping providers easier

**Impact:** No external changes—internal refactor only.

### Step 2.4: Add unit tests for scoring logic

With scoring logic extracted to pure functions:
- `breakdownUtils.ts` — easy to unit test
- `scoreLock.ts` — can test backoff logic
- `scoreTransaction.ts` — can mock the adapter

**Impact:** New test files only.

---

## Files Created (Phase 1)

| File | Lines (est.) | Purpose |
|------|--------------|---------|
| `backend/providerUtils.ts` | ~25 | Shared helpers: success, error, generateId |
| `firebase/scoring/breakdownUtils.ts` | ~35 | Pure breakdown math functions |
| `firebase/scoring/scoreLock.ts` | ~45 | Lock constants, error class, backoff, release |
| `firebase/scoring/scoreTransaction.ts` | ~60 | applyEntryScoreUpdate, updateEntryScoresWithLock |
| `firebase/firestoreAdapter.ts` | ~60 | Firestore abstraction layer |
| `firebase/arrayEntityAdapter.ts` | ~50 | Generic array-backed CRUD |
| `firebase/providers/contestsProvider.ts` | ~70 | Firebase contests implementation |
| `firebase/providers/entriesProvider.ts` | ~30 | Firebase entries implementation |
| `firebase/providers/judgesProvider.ts` | ~30 | Firebase judges implementation |
| `firebase/providers/scoresProvider.ts` | ~90 | Firebase scores implementation (most complex) |
| `firebase/firebaseBackendProvider.ts` | ~40 | Entry point only |

**Total:** 11 small files replacing 1 large file.

---

## Files Modified (Phase 1)

| File | Change |
|------|--------|
| `firebase/index.ts` | Update exports if needed |
| `backend/inMemoryProvider.ts` | Import from `providerUtils.ts` instead of local helpers |

---

## Files Modified (Phase 2)

| File | Change |
|------|--------|
| `backend/types.ts` | Remove deprecated `drinks` and `listByDrink` |
| Any file using `.drinks` | Change to `.entries` |
| Any file using `.listByDrink` | Change to `.listByEntry` |

---

## Execution Order

### Phase 1 (Safe, no external impact)
1. Create `backend/providerUtils.ts`
2. Update `inMemoryProvider.ts` to use it
3. Create `firebase/scoring/breakdownUtils.ts`
4. Create `firebase/scoring/scoreLock.ts`
5. Create `firebase/scoring/scoreTransaction.ts`
6. Create `firebase/firestoreAdapter.ts`
7. Create `firebase/arrayEntityAdapter.ts`
8. Create `firebase/providers/contestsProvider.ts`
9. Create `firebase/providers/entriesProvider.ts`
10. Create `firebase/providers/judgesProvider.ts`
11. Create `firebase/providers/scoresProvider.ts`
12. Slim down `firebase/firebaseBackendProvider.ts`
13. Update `firebase/index.ts` exports
14. Run TypeScript check + existing tests

### Phase 2 (Requires broader changes)
1. Audit deprecated alias usage across codebase
2. Update consumers
3. Remove deprecated types/properties
4. Add unit tests for extracted modules

---

## Success Criteria

- [ ] No individual file exceeds ~100 lines of complex logic
- [ ] `firebaseBackendProvider.ts` is a lean entry point (~40 lines)
- [ ] Scoring logic is testable without Firestore
- [ ] No duplicated utility functions across providers
- [ ] All existing functionality preserved
- [ ] TypeScript compiles without errors
- [ ] Existing tests pass
