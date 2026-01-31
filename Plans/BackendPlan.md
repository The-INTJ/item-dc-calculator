# Backend Plan - Cloud-First Architecture

## Status: IN PROGRESS - Local session management removed
**Last Updated:** January 31, 2026

All local data persistence (localStorage, sessionStorage) has been removed. The app now operates in cloud-only mode with Firebase/Firestore as the single source of truth.

## Scope and intent
This document outlines the backend architecture plan for the Mixology Rating App. It focuses on auth, user/session flows, data modeling, Firestore structure. All data is stored in and fetched from Firestore - no local persistence of contest data, votes, or user profiles.

## Progress tracker
See [Backend Progress](BackendProgress.md) for the current backend task status.

## Goals
- Cloud-first architecture: all data stored in and fetched from Firestore
- Firebase Auth handles all authentication and token persistence
- Support anonymous Firebase auth for guest flows (no custom cookie-based guest tracking)
- Enable Google authentication alongside email/password
- Provide admin authentication and role-based access for contest/drink management
- Allow any user (guest or registered) to vote; admins can vote like anyone else
- Allow a judge to mark themselves as the mixer of a drink (no voting allowed; auto‑assign full score)
- Allow any scoring section to be marked as "N/A" so non-drinkers can still score presentation and we can normalize aggregates
- Show friendly error messages when cloud data cannot be loaded
- Keep the dc-calculator app isolated from mixology backend changes

## Current foundation (cloud-first implementation)
- **Removed:** All localStorage/sessionStorage for contest data, votes, and profiles
- **Firebase Auth** handles token persistence automatically (no custom session storage)
- Provider abstraction in [src/features/mixology/server/backend/types.ts](src/features/mixology/server/backend/types.ts)
- In-memory backend for testing in [src/features/mixology/server/backend/inMemoryProvider.ts](src/features/mixology/server/backend/inMemoryProvider.ts)
- Firebase client integration in [src/features/mixology/server/firebase](src/features/mixology/server/firebase)
- Cloud-only auth context in [src/features/mixology/contexts/AuthContext.tsx](src/features/mixology/contexts/AuthContext.tsx)
- Contest lifecycle context (cloud-synced) in [src/features/mixology/contexts/ContestStateContext.tsx](src/features/mixology/contexts/ContestStateContext.tsx)
- Admin contest context (cloud-synced) in [src/features/mixology/contexts/AdminContestContext.tsx](src/features/mixology/contexts/AdminContestContext.tsx)
- Mixology routing in [app/(mixology)/mixology](app/(mixology)/mixology)
- Mixology API routes under [app/api/mixology](app/api/mixology)

## Guiding principles
1. Backend providers must implement the same interface so the UI remains stable
2. All user data, votes, and contest state live in Firestore - no local persistence
3. Firebase Auth handles all token persistence automatically
4. Auth logic should be composable: guest → registered user → admin
5. When cloud data cannot be loaded, show friendly error states (not blank screens)
6. Firestore rules should enforce least-privilege access
7. All server-side privileged operations should use Admin SDK
8. Voting is open to any user; the only restriction is mixer auto-scoring on rounds where they are the mixer

---

## Planned architecture

- Firebase Auth for email/password, Google OAuth, and anonymous sign-in
- Firebase handles token persistence automatically (no custom session storage)
- Auth state synced from Firestore on load

**Guest session:**
- Use Firebase anonymous authentication (no custom guest cookies or IDs)
- Anonymous users can vote and participate fully
- Anonymous users can upgrade to full accounts (linking Firebase anonymous → registered)

**Session data:**
- All data fetched from Firestore on app load
- No localStorage/cookies for contest data, votes, or profiles
- Only invite context cookie for onboarding flow continuity
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
### 3) Guest creation & Firebase anonymous auth
**Identity requirements:**
- Guests use Firebase anonymous authentication
- No custom collision-safe IDs needed (Firebase handles this)
- Anonymous users can be upgraded to registered accounts via Firebase account linking

**Plan:**
- Use `signInAnonymously()` from Firebase Auth
- Store anonymous user data in Firestore under their Firebase UID
- Invite context stored in cookies only for onboarding flow

**Cookie strategy:**
- `mixology_invite_context` only (contest slug, invite id, source)
- No guest ID cookies (Firebase Auth handles identity)
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
- Removed `pendingSync` (no local data to sync)
- Removed `guestIdentity` custom tracking (Firebase Auth handles this)
- `inviteContext` still stored for onboarding flow continuity
- All votes and profile data fetched from Firestore

---

## Backend provider roadmap

### Phase 1: Cloud-first client (CURRENT)
- Firebase Auth for all authentication (email/password, Google OAuth, anonymous)
- All contest data, votes, and profiles fetched from Firestore
- No local data persistence (removed localStorage/sessionStorage)
- Friendly error states when cloud is unavailable

### Phase 2: Firestore data provider
- Complete Firestore backend provider implementation
- Wire to API routes for server-side operations
- Add feature flag for switching between in-memory and Firestore

### Phase 3: Admin SDK server routes
- Add server actions or API routes for admin-only operations
- Move sensitive data validation to server
- Implement Firestore security rules

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
- Should anonymous users be allowed to create drinks in "practice mode" without admin approval?
- What is the expected retention window for anonymous user records in Firestore?
- How do we handle offline scenarios with cloud-only architecture?
## Open questions
- Should guest users be allowed to create drinks in “practice mode” without admin approval?
- Do we want multi-device guest session merging?
- What is the expected retention window for guest records in Firestore?

---

## Next steps
1. ~~Remove all localStorage/sessionStorage for data persistence~~ ✅ DONE
2. ~~Switch to Firebase anonymous auth for guests~~ ✅ DONE
3. ~~Add error states for cloud failures~~ ✅ DONE
4. Wire Firestore backend provider to production data flow
5. Implement Admin SDK integration for server-side contest updates
6. Implement invite validation and contest loading from Firestore
7. Implement mixer scoring logic and UI enforcement
8. Add N/A scoring and aggregation rules
