# Backend Flow Review (Mixology)

## Purpose
Provide a high-level map of the current backend flow, highlight non-standard Next.js/Firebase usage, and capture refactor targets, alternative architectures, and minimal libraries to consider.

## General Backend Flow

### Request/data flow (contests, entries, scores)
1. **Client UI and hooks**
   - Admin and app UI use client hooks (`useBackend`) and service wrappers (`adminApi`) to call the Next.js API routes via `fetch`.
   - Admin calls use Firebase ID tokens via Bearer auth header.

2. **Next.js route handlers**
   - API routes live under `app/api/mixology/...` and call `getBackendProvider()` to get a backend provider instance.
   - Route handlers handle parsing, validation, and basic error mapping before calling provider methods.

3. **Backend provider layer**
   - `getBackendProvider()` creates and initializes a singleton provider, currently `createFirebaseBackendProvider()`.
   - Provider interfaces (`ContestsProvider`, `EntriesProvider`, `JudgesProvider`, `ScoresProvider`) define CRUD + list behavior and are wired to Firestore implementations.

4. **Firebase integration**
   - The Firebase backend provider uses the Firebase *client SDK* to connect to Firestore.
   - It checks env vars for `NEXT_PUBLIC_FIREBASE_*` and falls back to “local-only mode” when not configured.

### Authentication flow
1. **Client auth context**
   - `MixologyAuthProvider` uses a singleton Firebase auth provider.
   - On initialization it loads user data from Firestore when a Firebase UID exists.
   - Exports `getAuthToken()` for obtaining ID tokens for API calls.

2. **Server-side auth**
   - `getCurrentUser` validates Firebase session cookies via Admin SDK.
   - `getCurrentUserFromRequest` validates Bearer tokens from Authorization header.
   - `requireAdmin` checks real auth first, allows legacy `x-mixology-role` header only in dev/when explicitly enabled.

## Non-standard Next.js / Firebase usage

### Next.js patterns that stand out
- **API routes use provider singleton with side effects**: A module-level singleton is created and initialized lazily. This is workable but deviates from typical stateless route handlers and can be brittle in serverless environments.
- **Route param handling uses `params: Promise<...>`**: Next.js route handlers typically accept plain params, and the async `params` shape indicates custom handling.

### Firebase patterns that stand out
- **Firebase client SDK used on the server**: The backend provider uses Firebase client SDK for Firestore instead of Firebase Admin SDK. This is workable but admin operations need to go through the separate Admin SDK setup.
- **Uses `NEXT_PUBLIC_*` envs server-side**: Backend uses env vars intended for client usage, meaning server behavior is tightly coupled to client configuration.
- **Local-only fallback for data writes**: Backend provider initializes with a warning and then proceeds without persistence if Firebase is misconfigured. This can lead to silent data loss.

## Files to Refactor (ordered by impact)

### High impact / core flow
- **`src/features/mixology/server/backend/index.ts`**
  - Singleton provider and initialization logic; central to backend wiring.
- **`src/features/mixology/server/firebase/firebaseBackendProvider.ts`**
  - Uses client SDK and local-only fallback logic; main Firebase integration point.

### Important but secondary
- **`src/features/mixology/contexts/AuthContext.tsx`**
  - Client auth is cloud-first with clean session management.
- **`app/api/mixology/contests/[id]/route.ts`** and related routes
  - Contest lookup does an in-memory search after fetching all contests; consider server-side query patterns.

## Architectures and flows to consider

### 1) ~~Proper server-side Firebase Admin flow~~ ✓ DONE
- ~~Use Firebase Admin SDK in API routes (or an internal server layer) to validate session cookies and access Firestore securely.~~
- ~~Replace `requireAdmin` header check with verification of Firebase ID token / custom claims.~~
- ~~Keep client SDK usage on the client only; the server handles authenticated Firestore access with admin privileges.~~

### 2) Clear separation of data access vs. API handling
- Move request parsing/validation into route handlers, keep provider layer pure (no route-specific logic).
- Consider a service layer per domain (contests, entries, scores) that can be called from route handlers and background jobs.

### 3) Replace singleton provider with request-scoped providers
- For serverless-friendly behavior, avoid module-level singleton and initialize per request (or cache with careful boundaries).
- This reduces risk of stale state or partially initialized providers.

### 4) Unify admin/client data paths
- Right now there are duplicate pathways (hooks + adminApi + contexts) that all fetch via API routes.
- Consolidate into one client data layer (e.g., a single service module) so the UI isn’t split across multiple fetching patterns.
### 5) Consolidate ContestStateContext into AdminContestContext

**Current situation:**
- `ContestStateContext` (~75 lines) holds a single `state` value (`'set' | 'shake' | 'scored'`) with labels/descriptions.
- `AdminContestContext` fetches contests and syncs the active contest's `phase` to `ContestStateContext` via an effect.
- Multiple components use `useContestState()` to read the current state.

**Problem:** This is unnecessary indirection. The contest phase is already stored on the contest object in `AdminContestContext`. The sync effect creates a redundant data path and adds complexity.

**Proposed architecture:**
1. **Move constants to a standalone file** (`src/features/mixology/constants/contestStates.ts`):
   ```typescript
   export type ContestState = 'set' | 'shake' | 'scored';
   export const CONTEST_STATES: ContestState[] = ['set', 'shake', 'scored'];
   export const contestStateLabels: Record<ContestState, string> = { ... };
   export const contestStateDescriptions: Record<ContestState, string> = { ... };
   ```

2. **Extend `AdminContestContext`** to expose state-derived values:
   - Add `currentPhase`, `currentPhaseLabel`, `currentPhaseDescription` to the context value.
   - These are computed from the active contest's `phase` field.

3. **Delete `ContestStateContext.tsx`** entirely.

4. **Update consumers** to use `useAdminContestData()` instead of `useContestState()`:
   - `NavBar.tsx`: `const { currentPhase, currentPhaseLabel } = useAdminContestData();`
   - `AdminStateControls.tsx`: Same pattern.
   - `ContestPhaseControls.tsx`: Same pattern.

**Benefits:**
- Eliminates ~75 lines and one context provider.
- Removes the sync effect that copies data between contexts.
- Single source of truth for contest state.
- Simpler provider tree in `RootLayoutClient.tsx`.
## Libraries to Consider (minimal)

> **Only include libraries if they solve a concrete problem without bloat.**

- **`firebase-admin`** ✓ INSTALLED
  - Now installed and configured for server-side auth and admin operations.

No additional client libraries are recommended at this time; fetching and state management are already handled and extra layers would add complexity without clear payoff.

---

## Completed Refactors

### 2026-02-04: Implemented proper server-side auth

**Problem:** Server auth (`getCurrentUser`, `getCurrentUserFromRequest`) was a stub returning `null`.

**Changes:**
- Implemented `src/features/mixology/server/firebase/admin.ts` with Firebase Admin SDK initialization
- Updated `src/features/mixology/server/auth.ts` to verify session cookies and ID tokens via Admin SDK
- Updated `app/api/mixology/_lib/requireAdmin.ts` to check real auth first, fall back to legacy header only in dev or when explicitly enabled

**Result:** Server-side auth now properly validates Firebase tokens. Admin routes are secured with real authentication.

---

### 2026-02-04: Simplified MixologyDataContext

**Problem:** `MixologyDataContext` had dead code from a planned server integration that was never completed - hardcoded null values, no-op functions, and commented TODOs.

**Changes:**
- Removed hardcoded `serverContest`, `serverLoading`, `serverError` variables
- Removed no-op `refresh` function and unnecessary `refreshAllLocal` wrapper
- Removed unused `useCallback` import and `buildEntrySummaries` import
- Simplified loading state to derive from `contests.length === 0`
- Consolidated duplicate `useEffect` cleanup patterns
- Deleted orphaned `lib/auth/__tests__/cookies.test.ts` (tested removed functions)
- Fixed `lib/auth/__tests__/invite.test.ts` (removed test for removed `guestIndex` option)

**Result:** ~60 lines deleted total (35 from component, 25 from orphaned tests), cleaner component that only uses data from AdminContestContext.

---

### 2026-02-04: Removed dead code from client data layer

**Problem:** The `useBackend.ts` hooks (`useContests`, `useContest`, `useContestMutations`) duplicated functionality already in `AdminContestContext` + `adminApi`, and were never actually imported/used anywhere in the codebase.

**Changes:**
- Removed unused hooks: `useContests`, `useContest`, `useContestMutations`
- Removed `MutationState` type export
- Simplified `useCurrentContest` - removed `useAuth` dependency (public endpoint doesn't need auth checking)
- Deleted `services/api.ts` (inlined `extractCurrentContest` into the hook)
- Deleted `services/__tests__/api.test.ts`
- Updated `hooks/index.ts` exports

**Result:** ~190 lines deleted, single responsibility for `useBackend.ts` (just fetches current contest), cleaner separation between admin operations (`adminApi`) and public data access (`useCurrentContest`).

---

### 2026-02-04: Removed mock auth provider and cache layer

**Problem:** 
- `mockAuthProvider.ts` (~190 lines) was only used when Firebase wasn't configured. Since Firebase is always required in production, this was dead weight.
- `cache.ts` (~28 lines) provided "show last contest while loading" caching that was redundant with `AdminContestContext` already holding contest state.

**Changes:**
- Deleted `lib/auth/mockAuthProvider.ts`
- Deleted `services/cache.ts` and `services/__tests__/cache.test.ts`
- Updated `AuthContext.tsx` to throw an error if Firebase isn't configured instead of falling back to mock
- Removed cache imports/usage from `MixologyDataContext.tsx`

**Result:** ~260 lines deleted, cleaner architecture with no fallback paths.

---

### 2026-02-04: Migrated adminApi to use Bearer tokens

**Problem:** `adminApi.ts` used the legacy `x-mixology-role: admin` header for authentication, which is easy to spoof.

**Changes:**
- Added `getIdToken()` method to `AuthProvider` interface and Firebase implementation
- Exported `getAuthToken()` from `AuthContext` for obtaining current ID token
- Updated `adminApi.ts` to call `getAuthToken()` and send `Authorization: Bearer <token>` header
- Removed hardcoded `x-mixology-role: admin` header

**Result:** Admin API calls now use real Firebase authentication. Legacy header can be disabled in production by setting `MIXOLOGY_ALLOW_ADMIN_HEADER=false`.
