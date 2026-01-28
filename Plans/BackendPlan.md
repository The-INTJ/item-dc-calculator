# Backend Plan

## Scope and intent
This document outlines the backend architecture plan for the Mixology Rating App. It focuses on auth, user/session flows, data modeling, Firestore structure, and how we will evolve the current provider abstraction to support production workflows. No code changes are proposed here.

## Progress tracker
See [Backend Progress](BackendProgress.md) for the current backend task status.

## Goals
- Support QR/URL invite flows that auto-create a guest session.
- Provide guest account creation with cookie + local session persistence and collision‑safe identifiers.
- Enable Google authentication alongside email/password.
- Enable anonymous Firebase authentication for guest flows.
- Provide admin authentication and role-based access for contest/drink management.
- Allow any user (guest or registered) to vote; admins can vote like anyone else.
- Allow a judge to mark themselves as the mixer of a drink (no voting allowed; auto‑assign full score).
- Allow any scoring section to be marked as “N/A” so non‑drinkers can still score presentation and we can normalize aggregates.
- Preserve the provider abstraction so UI code does not care about backend implementation.
- Keep the dc-calculator app isolated from mixology backend changes.

## Current foundation (already implemented)
- Provider abstraction in [src/features/mixology/server/backend/types.ts](src/features/mixology/server/backend/types.ts).
- In-memory backend in [src/features/mixology/server/backend/inMemoryProvider.ts](src/features/mixology/server/backend/inMemoryProvider.ts).
- Firebase client integration in [src/features/mixology/server/firebase](src/features/mixology/server/firebase).
- Auth context and session storage in [src/features/mixology/contexts](src/features/mixology/contexts) and [src/features/mixology/lib/auth](src/features/mixology/lib/auth).
- Contest lifecycle context in [src/features/mixology/contexts/ContestStateContext.tsx](src/features/mixology/contexts/ContestStateContext.tsx).
- Local admin contest storage in [src/features/mixology/contexts/AdminContestContext.tsx](src/features/mixology/contexts/AdminContestContext.tsx).
- Mixology routing in [app/(mixology)/mixology](app/(mixology)/mixology).
- Mixology API routes under [app/api/mixology](app/api/mixology).

## Guiding principles
1. Backend providers must implement the same interface so the UI remains stable.
2. Auth logic should be composable: guest → registered user → admin.
3. Session identity must be stable across browser refresh and short-term device reuse.
4. Firestore rules should enforce least-privilege access.
5. All server-side privileged operations should use Admin SDK.
6. Voting is open to any user; the only restriction is mixer auto-scoring on rounds where they are the mixer.

---

## Planned architecture

### 1) Auth & session strategy
**Client auth:**
- Firebase Auth for email/password, Google OAuth, and anonymous sign-in.
- Auth state stored in local session and synchronized when connected.

**Guest session:**
- Use anonymous Firebase sign-in when a URL includes the onboarding query or when the user chooses “Continue as Guest.”
- Store guest identity in cookies for routing continuity and in localStorage for session state.
- Guests can rate but are treated as “temporary users” in Firestore.

**Session data sources:**
- Cookies: short session continuity + referral metadata.
- localStorage: rich session state (votes, profile, pending sync) as defined in [src/features/mixology/lib/auth/types.ts](src/features/mixology/lib/auth/types.ts).

### 2) Invite URL & QR flow
**URL shape (proposal):**
- `/mixology?invite=abc123&contest=summer-2026`

**Expected behavior:**
- Auto-create guest session if not authenticated (via `InviteBootstrap`).
- Persist invite metadata (contest slug, invite id, source).
- Route to the contest view or onboarding flow.

**Server logic:**
- Validate invite id and contest slug.
- Create a minimal guest record if none exists (see guest creation below).

### 3) Guest creation & collision-safe IDs
**Identity requirements:**
- Guests must not collide across devices or sessions.
- Must allow multiple guests on the same device without overwriting.

**Plan:**
- Use cryptographically strong random ID (e.g., 128 bits) and prefix with `guest_`.
- Store a per-device “guest index” in cookies to allow multiple guests.
- Use hashed or opaque identifiers in Firestore; do not use invite code as primary ID.

**Cookie strategy:**
- `mixology_guest_id` (current guest)
- `mixology_guest_index` (array of guest ids for quick selection)
- `mixology_invite_context` (contest slug, invite id, source)

### 4) User roles and voting permissions
**Roles:**
- `user` (default) - can vote and view brackets
- `mixologist` - can register drinks and compete
- `admin` - full edit permissions

**Voting permissions:**
- All authenticated users can vote on active rounds (no admin gate).
- Guests can vote (anonymous Firebase auth).
- **Mixologist restriction**: If a user is the mixologist on a drink in the current round, they cannot manually vote on that round. Their score auto-counts as full marks.
- **Admins**: Can vote and edit everything, including on rounds where they are the mixologist (but defaults apply).

**Role storage:**
- Store roles on user profile documents.
- Track mixologist→drink associations via `drink.mixerUserId` or contest roster.
- Restrict admin-only operations via Firestore rules and server routes.

### 5) Mixer-of-drink behavior
**Requirement:**
- Users can register as mixologists and submit drinks to contests.
- If a user is the mixologist for a drink in the active round, they cannot manually vote on that round.
- The mixologist's score should be full/full across all values automatically.
- On rounds where they are NOT the mixologist, they vote normally.

**Data model additions:**
- `drink.mixerUserId` (or `mixerGuestId` for guests).
- `score.isMixerScore` boolean (true for auto-generated scores).
- `score.value` auto-populated with max values when mixer is set.

**Validation rules:**
- Check if `judgeId` matches any `drink.mixerUserId` in the current round.
- If match found, block manual vote submission OR auto-generate full scores.
- Admins bypass this check but defaults still apply.

### 6) N/A scoring behavior
**Requirement:**
- Users can mark any scoring section as “N/A”.
- Aggregation logic should normalize scores based on which sections were actually scored.

**Data model additions:**
- `score.naSections` (array of section keys)
- `score.sectionScores` should allow `null` or omit fields when marked N/A

**Aggregation rules:**
- Compute averages per section using only non‑N/A entries.
- Compute overall drink scores using weighted normalization to avoid penalizing N/A sections.

---

## Data model (current + proposed)

### Contest model (current)
Defined in [src/features/mixology/types/types.ts](src/features/mixology/types/types.ts):
- `Contest` with rounds, categories, drinks, scores, judges.
- `ContestRound` for round state and numbering.

### Firestore collections (planned)
- `mixology_users/{uid}`
  - `displayName`, `email`, `role`, `createdAt`
- `mixology_guests/{guestId}`
  - `inviteId`, `contestId`, `createdAt`, `lastSeenAt`, `deviceFingerprint`
- `mixology_contests/{contestId}`
  - `name`, `slug`, `phase`, `createdAt`, `categories[]`
- `mixology_contests/{contestId}/drinks/{drinkId}`
  - `name`, `mixerUserId`, `mixerGuestId`
- `mixology_contests/{contestId}/scores/{scoreId}`
  - `userId`, `guestId`, `drinkId`, `score`, `naSections`, `isMixerScore`, `createdAt`

### Session payload updates
- Add `inviteContext` to local session.
- Add `guestIdentity` metadata for easy reconciliation with Firestore.

---

## Backend provider roadmap

### Phase 1: Client-side Firebase (current)
- Continue using Firebase Auth client SDK in [src/features/mixology/server/firebase/firebaseAuthProvider.ts](src/features/mixology/server/firebase/firebaseAuthProvider.ts).
- Keep in-memory backend for contest data for now.

### Phase 2: Firestore data provider (client or server)
- `firebaseBackendProvider.ts` implements the provider but is not wired to API routes.
- Add feature flag or config to swap provider in [src/features/mixology/server/backend/index.ts](src/features/mixology/server/backend/index.ts).

### Phase 3: Admin SDK server routes
- Add server actions or API routes for admin-only operations.
- Move sensitive data validation to server.

---

## Security rules (baseline)
- Users can read/write their own profile.
- Contests are readable for authenticated users.
- Admin-only write access for contests/drinks/judges.
- Scores: users can only write their own scores (or server writes for mixer score).
- Scores must validate that N/A sections are excluded from required scoring fields.

---

## API surface (current + planned)
- `/api/mixology/current` (fetch default contest)
- `/api/mixology/contests` (list/create contests)
- `/api/mixology/contests/[id]` (single contest CRUD)
- `/api/mixology/contests/[id]/drinks` (drinks CRUD)
- `/api/mixology/contests/[id]/categories` (vote category CRUD)
- `/api/mixology/contests/[id]/scores` (score read/write)
- `/api/mixology/invite` (planned: validate invite, return contest)
- `/api/mixology/guests` (planned: create guest)

---

## Open questions
- Should guest users be allowed to create drinks in “practice mode” without admin approval?
- Do we want multi-device guest session merging?
- What is the expected retention window for guest records in Firestore?

---

## Next steps
1. Wire Firestore backend provider behind a feature flag.
2. Add Admin SDK integration for server-side contest updates.
3. Implement invite validation and guest creation APIs.
4. Implement mixer scoring logic and UI enforcement.
5. Add N/A scoring and aggregation rules.
