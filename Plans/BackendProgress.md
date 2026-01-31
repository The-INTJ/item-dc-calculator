# Backend Progress: Admin Page Server Integration

## Current Architecture Analysis

### Overview

The Mixology admin page currently uses a **local-first architecture** where:
1. Admin data mutations happen in **React context state (localStorage)** via `AdminContestContext`
2. API routes exist but are **not actively used** by most admin operations
3. The backend uses an **in-memory provider** that resets on each server restart

### How the Admin Page Currently Interacts with the Backend

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT FLOW DIAGRAM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌───────────────────────┐     ┌─────────────────┐ │
│  │   Admin Page     │     │  AdminContestContext  │     │  localStorage   │ │
│  │  (AdminDashboard)│────▶│  (Client State)       │────▶│  (Persistence)  │ │
│  └──────────────────┘     └───────────────────────┘     └─────────────────┘ │
│           │                                                                  │
│           │ (only ContestSetupForm & ContestConfigEditor)                    │
│           ▼                                                                  │
│  ┌──────────────────┐     ┌───────────────────────┐     ┌─────────────────┐ │
│  │   fetch() calls  │────▶│  API Routes           │────▶│  InMemoryProvider│ │
│  │                  │     │  (/api/mixology/...)  │     │  (Server State) │ │
│  └──────────────────┘     └───────────────────────┘     └─────────────────┘ │
│                                                                              │
│  ❌ Problem: These two data flows are NOT synchronized                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Component-by-Component Analysis

#### 1. AdminDashboard.tsx
- **Data Source**: `useAdminContestData()` (local context)
- **Mutations**: `updateContest()`, `setActiveContest()`, `refresh()` — all local
- **Server Calls**: None directly

#### 2. ContestDetails.tsx
- **Data Source**: Props from parent (which comes from local context)
- **Mutations**: `onContestUpdated()` callback to parent
- **Server Calls**: `handleSaveConfig()` calls `PATCH /api/mixology/contests/${id}` ✅
  - This is ONE of the few components that actually hits the server

#### 3. ContestSetupForm.tsx
- **Data Source**: Local form state
- **Mutations**: Creates contest via API, then calls `upsertContest()` to sync local
- **Server Calls**: `POST /api/mixology/contests` ✅
  - Creates contest on server AND updates local context

#### 4. AdminContestRounds.tsx
- **Data Source**: Props from parent (local context)
- **Mutations**: `addRound()`, `removeRound()`, `setActiveRound()`, `setRoundState()` — all LOCAL
- **Server Calls**: None ❌

#### 5. AdminMixologists.tsx
- **Data Source**: Props from parent (local context)
- **Mutations**: `addMixologist()`, `updateMixologist()`, `removeMixologist()` — all LOCAL
- **Server Calls**: None ❌

#### 6. ContestPhaseControls.tsx
- **Data Source**: Props and `useContestState()`
- **Mutations**: None (read-only display)
- **Server Calls**: None

### Current API Routes (Already Implemented)

| Route | Methods | Status |
|-------|---------|--------|
| `/api/mixology/contests` | GET, POST | ✅ Working |
| `/api/mixology/contests/[id]` | GET, PATCH, DELETE | ✅ Working |
| `/api/mixology/contests/[id]/drinks` | GET, POST | ✅ Working |
| `/api/mixology/contests/[id]/drinks/[drinkId]` | GET, PATCH, DELETE | ⚠️ Need to verify |
| `/api/mixology/contests/[id]/scores` | GET, POST | ✅ Working |
| `/api/mixology/current` | GET | ✅ Working |

### Data Storage

- **API Routes**: Use `inMemoryProvider` (data lost on restart)
- **Client Admin**: Uses `localStorage` via `AdminContestContext`
- **Firebase Provider**: Exists but not wired up (`firebaseBackendProvider.ts`)

---

## Problems to Solve

### P1: Local vs Server State Desync
Most admin operations update localStorage but NOT the server. This means:
- Changes don't persist across server restarts
- Multiple admins see different data
- Production deployment would lose all changes

### P2: In-Memory Provider is Not Production-Ready
The `inMemoryProvider` resets on every deployment/restart.

### P3: Duplicate Data Flows
Same data lives in two places with no sync mechanism.

### P4: Inconsistent API Usage
Only 2 of 6 admin components use the API; the rest bypass it.

---

## Implementation Plan

### Phase 1: Unify Admin Operations Through API (Priority: HIGH)

**Goal**: All admin mutations should go through API routes first, then update local state.

#### Step 1.1: Create Admin API Service Layer
Create a new service file that wraps all admin API calls:

```typescript
// src/features/mixology/services/adminApi.ts
export const adminApi = {
  // Contests
  updateContest: (id: string, updates: Partial<Contest>) => 
    fetch(`/api/mixology/contests/${id}`, { method: 'PATCH', ... }),
  
  // Rounds (new endpoints needed)
  addRound: (contestId: string, round: ContestRound) => ...,
  updateRound: (contestId: string, roundId: string, updates: Partial<ContestRound>) => ...,
  deleteRound: (contestId: string, roundId: string) => ...,
  
  // Entries/Mixologists
  addEntry: (contestId: string, entry: Entry) => 
    fetch(`/api/mixology/contests/${contestId}/drinks`, { method: 'POST', ... }),
  updateEntry: (contestId: string, entryId: string, updates: Partial<Entry>) => ...,
  deleteEntry: (contestId: string, entryId: string) => ...,
};
```

#### Step 1.2: Refactor AdminContestContext
Change from local-first to API-first:

```typescript
// Before (current):
const addRound = (contestId, round) => {
  updateState((prev) => { /* modify local state */ });
};

// After (proposed):
const addRound = async (contestId, round) => {
  const result = await adminApi.updateContest(contestId, { 
    rounds: [...currentRounds, round] 
  });
  if (result.success) {
    updateState((prev) => { /* sync local state with server response */ });
  }
};
```

#### Step 1.3: Add Loading/Error States
Admin components need to show feedback for async operations:
- Loading spinners during mutations
- Error toast notifications on failure
- Optimistic updates with rollback

### Phase 2: Extend API Routes (Priority: HIGH)

**Goal**: Ensure all necessary CRUD operations have endpoints.

#### Step 2.1: Verify Existing Routes
- Test `PATCH /api/mixology/contests/[id]` with round updates
- Test `POST/PATCH/DELETE /api/mixology/contests/[id]/drinks/[drinkId]`

#### Step 2.2: Add Missing Endpoints (if needed)
The current design embeds rounds within the Contest document. Verify that updating `contest.rounds` via PATCH works correctly. If not, add dedicated round endpoints:

```typescript
// app/api/mixology/contests/[id]/rounds/route.ts
POST   /api/mixology/contests/[id]/rounds      - Add round
PATCH  /api/mixology/contests/[id]/rounds/[roundId] - Update round
DELETE /api/mixology/contests/[id]/rounds/[roundId] - Delete round
```

### Phase 3: Wire Up Firebase Provider (Priority: MEDIUM)

**Goal**: Replace in-memory provider with Firebase for persistence.

#### Step 3.1: Configure Firebase Admin SDK
For server-side API routes, use Firebase Admin SDK instead of client SDK.

#### Step 3.2: Environment Detection
```typescript
// src/features/mixology/server/backend/index.ts
export async function getBackendProvider(): Promise<MixologyBackendProvider> {
  if (!_provider) {
    const useFirebase = process.env.USE_FIREBASE === 'true';
    _provider = useFirebase 
      ? createFirebaseBackendProvider() 
      : createInMemoryProvider();
  }
  // ...
}
```

#### Step 3.3: Test Firebase Integration
- Run with `USE_FIREBASE=false` for local dev
- Run with `USE_FIREBASE=true` for production/staging

### Phase 4: Clean Up Redundant Local State (Priority: LOW)

**Goal**: Remove localStorage persistence once Firebase is stable.

#### Step 4.1: Deprecate localStorage Keys
Keep localStorage as a fallback/cache but make server the source of truth.

#### Step 4.2: Simplify AdminContestContext
Convert from a full data store to a thin caching layer:
```typescript
// Fetch from server on mount
// Cache in context for fast reads
// Mutations go to server, then invalidate cache
```

---

## Suggested Architecture Cleanups

### 1. Consolidate Backend Hooks
Currently have:
- `useBackend.ts` (hooks for API calls)
- `useContestMutations()` (mutation helpers)
- `useAdminContestData()` (local state)

**Suggestion**: Create a unified `useAdminData()` hook that:
- Fetches from `/api/mixology/contests` on mount
- Provides mutation methods that hit API then update cache
- Exposes loading/error states

### 2. Standardize Error Handling
Create a consistent error handling pattern:
```typescript
// services/adminApi.ts
async function apiRequest<T>(url: string, options: RequestInit): Promise<ProviderResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 
        'Content-Type': 'application/json',
        'x-mixology-role': 'admin',
        ...options.headers 
      },
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.message };
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
```

### 3. Remove Debug Toggle Complexity
The `useLocalDebugData` toggle adds complexity. Consider:
- Using environment variables for debug data instead
- Or making it a query param (`?debug=true`) for testing

### 4. Type Safety Improvements
- Add Zod schemas for API request/response validation
- Share types between frontend and API routes via a common types file

---

## Implementation Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Create `adminApi.ts` service | Small | High |
| 2 | Refactor `AdminMixologists` to use API | Medium | High |
| 3 | Refactor `AdminContestRounds` to use API | Medium | High |
| 4 | Add loading states to admin components | Small | Medium |
| 5 | Verify/fix drinks PATCH/DELETE endpoints | Small | Medium |
| 6 | Wire up Firebase provider | Large | High |
| 7 | Add error toast notifications | Small | Medium |
| 8 | Clean up localStorage fallback | Small | Low |

---

## Files to Modify

### New Files
- `src/features/mixology/services/adminApi.ts` — Centralized API service

### Modified Files
- `src/features/mixology/contexts/AdminContestContext.tsx` — Convert mutations to API-first
- `src/features/mixology/components/adminPage/AdminMixologists.tsx` — Add async handling
- `src/features/mixology/components/adminPage/AdminContestRounds.tsx` — Add async handling
- `src/features/mixology/server/backend/index.ts` — Add Firebase provider toggle
- `app/api/mixology/contests/[id]/drinks/[drinkId]/route.ts` — Verify PATCH/DELETE

---

## Success Criteria

1. ✅ All admin operations persist across server restarts
2. ✅ Multiple admins see the same data
3. ✅ Loading states visible during mutations
4. ✅ Errors displayed to user on failure
5. ✅ No data loss when switching between local/server modes
