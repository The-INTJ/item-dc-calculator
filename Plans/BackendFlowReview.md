# Backend Flow Review (Mixology)

## Purpose
Provide a high-level map of the current backend flow, highlight non-standard Next.js/Firebase usage, and capture refactor targets, alternative architectures, and minimal libraries to consider.

## General Backend Flow

### Request/data flow (contests, entries, scores)
1. **Client UI and hooks**
   - Admin and app UI use client hooks (`useBackend`) and service wrappers (`adminApi`) to call the Next.js API routes via `fetch`.
   - Admin-only calls send a role header `x-mixology-role: admin` and rely on that header for access control.

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
   - `MixologyAuthProvider` uses a singleton auth provider. It uses Firebase auth if configured; otherwise falls back to a mock provider.
   - On initialization it loads user data from Firestore when a Firebase UID exists.

2. **Server-side auth (placeholder)**
   - `getCurrentUser` reads a session cookie but does not validate it; it returns `null` until Firebase Admin SDK is set up.

## Non-standard Next.js / Firebase usage

### Next.js patterns that stand out
- **Authorization via custom header only**: API routes gate admin access solely on `x-mixology-role` header, which is easy to spoof without a real auth layer.
- **API routes use provider singleton with side effects**: A module-level singleton is created and initialized lazily. This is workable but deviates from typical stateless route handlers and can be brittle in serverless environments.
- **Route param handling uses `params: Promise<...>`**: Next.js route handlers typically accept plain params, and the async `params` shape indicates custom handling.

### Firebase patterns that stand out
- **Firebase client SDK used on the server**: The backend provider and auth provider use Firebase client SDK for server routes instead of Firebase Admin SDK. This makes server-side security and admin actions harder/less reliable.
- **Uses `NEXT_PUBLIC_*` envs server-side**: Backend uses env vars intended for client usage, meaning server behavior is tightly coupled to client configuration.
- **Auth on server is a stub**: `getCurrentUser` is a placeholder and always returns `null` until Firebase Admin SDK is added.
- **Local-only fallback for data writes**: Backend provider initializes with a warning and then proceeds without persistence if Firebase is misconfigured. This can lead to silent data loss.

## Files to Refactor (ordered by impact)

### High impact / core flow
- **`src/features/mixology/server/backend/index.ts`**
  - Singleton provider and initialization logic; central to backend wiring.
- **`src/features/mixology/server/firebase/firebaseBackendProvider.ts`**
  - Uses client SDK and local-only fallback logic; main Firebase integration point.
- **`src/features/mixology/server/auth.ts`**
  - Server auth is currently stubbed; needs real verification.
- **`app/api/mixology/_lib/requireAdmin.ts`**
  - Authorization is a static header check. Replace with real auth/claims.

### Important but secondary
- **`src/features/mixology/contexts/AuthContext.tsx`**
  - Client auth is cloud-first but mixes local session logic and has fallback providers.
- **`src/features/mixology/services/adminApi.ts`**
  - Centralized admin API uses hard-coded admin header; replace with auth tokens or cookie-based auth.
- **`app/api/mixology/contests/[id]/route.ts`** and related routes
  - Contest lookup does an in-memory search after fetching all contests; consider server-side query patterns.

## Architectures and flows to consider

### 1) Proper server-side Firebase Admin flow
- Use Firebase Admin SDK in API routes (or an internal server layer) to validate session cookies and access Firestore securely.
- Replace `requireAdmin` header check with verification of Firebase ID token / custom claims.
- Keep client SDK usage on the client only; the server handles authenticated Firestore access with admin privileges.

### 2) Clear separation of data access vs. API handling
- Move request parsing/validation into route handlers, keep provider layer pure (no route-specific logic).
- Consider a service layer per domain (contests, entries, scores) that can be called from route handlers and background jobs.

### 3) Replace singleton provider with request-scoped providers
- For serverless-friendly behavior, avoid module-level singleton and initialize per request (or cache with careful boundaries).
- This reduces risk of stale state or partially initialized providers.

### 4) Unify admin/client data paths
- Right now there are duplicate pathways (hooks + adminApi + contexts) that all fetch via API routes.
- Consolidate into one client data layer (e.g., a single service module) so the UI isn’t split across multiple fetching patterns.

## Libraries to Consider (minimal)

> **Only include libraries if they solve a concrete problem without bloat.**

- **`firebase-admin`** (server only)
  - Needed to securely verify auth tokens and use Firestore with admin privileges.
  - This is the most meaningful addition because it enables correct server-side auth and data access.

No additional client libraries are recommended at this time; fetching and state management are already handled and extra layers would add complexity without clear payoff.
