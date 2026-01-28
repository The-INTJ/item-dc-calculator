# Mixology Rating App Progress

## Overview
We are introducing a contest-focused Mixology Rating App that will sit alongside the existing Shard DC calculator. The mixology experience is the primary entry point during events, while the dc-calculator app remains available on a dedicated peer route for shared workflows.

## Step Log
- **Step 1 (Scaffolding and coexistence)**: Completed. Added dedicated mixology routing and navigation while preserving the dc-calculator app on a separate path.
- **Step 2 (Data model and backend foundation)**: Completed. Defined typed contest/drink/judge/score schemas with seeded data, plus read-only API at `/api/mixology/contests`.
- **Step 2.5 (Backend abstraction layer)**: Completed. Created a provider-based abstraction layer enabling seamless switching between in-memory, Firebase, or other backends without modifying frontend code. Added full CRUD API endpoints and basic admin validation UI.
- **Step 3 (Guest/user session management)**: Completed. Built localStorage-based session persistence, guest mode with optional account creation, and auth provider abstraction for future Firebase integration.
- **Step 4 (Firebase integration)**: Completed. Integrated Firebase Auth (Google + anonymous) and prepared Firestore backend provider. Client-side auth fully operational; API routes continue using in-memory provider for now (server-side Firebase Admin SDK planned for future).
- **Step 5 (Rounds + drinks UI and category voting flow)**: Completed. Added round/drink UI components, vote categories with backend submission, and admin category management.
- **Step 6 (Contest lifecycle + admin tooling)**: Completed. Added contest lifecycle state management (Debug/Set/Shake/Scored), local admin contest storage, round state controls, mixologist management, and contest detail editing in `/mixology/admin`.
- **Step 7 (Bracket + score panel)**: Completed. Added bracket view backed by contest rounds and vote score panels with contest-state gating and totals.

## Architectural Decisions
- **Routing structure**: The mixology experience lives under `/mixology`, with the landing page at `/`. This ensures contest participants arrive at the mixology shell by default while keeping the new flow isolated from dc-calculator code paths.
- **DC-calculator exposure**: The original Shard DC calculator resides at `/dc-calculator` as a peer experience with its own dedicated route.
- **Navigation and layouts**: The shared header renders only on `/` and `/mixology` routes and does not surface dc-calculator navigation. The main content area remains neutral to support both the new shell and dc-calculator UI without altering existing calculator components.
- **Feature placement**: Future mixology features (admin tools, voting, standings, brackets, invites) should be added within the `/mixology` route and associated subdirectories. Any new API routes or server actions should be namespaced for mixology to avoid collisions with calculator logic.
- **Constraints/assumptions**: DC-calculator behavior and styling should remain supported aside from shared layout work. Mixology additions should avoid modifying shared dc-calculator styles; instead, prefer scoped styles or new modules under the mixology tree.
- **Backend provider pattern**: All data access goes through `MixologyBackendProvider` interface (`src/features/mixology/server/backend/types.ts`). To switch backends (e.g., from in-memory to Firebase), implement the provider interface and swap the factory call in `src/features/mixology/server/backend/index.ts`. Frontend hooks and API routes remain unchanged.
- **Session/auth pattern**: User sessions are stored in localStorage with a provider abstraction for authentication. Guest users can vote and their data persists locally. When they create an account, local data is migrated to the backend. The auth provider can be swapped from mock to Firebase without changing any UI code.

## Backend Abstraction Layer

### Provider Interface
Located in `src/features/mixology/server/backend/types.ts`, the abstraction defines:
- `ContestsProvider`: CRUD operations for contests
- `DrinksProvider`: Manage drinks within contests
- `JudgesProvider`: Manage judges within contests
- `ScoresProvider`: Submit and manage ratings
- `MixologyBackendProvider`: Aggregates all sub-providers with init/dispose lifecycle

### Current Implementation
- **In-Memory Provider** (`src/features/mixology/server/backend/inMemoryProvider.ts`): Stores data in memory using seed data. Perfect for local development and testing.
- **Firestore Provider (prepared)** (`src/features/mixology/server/firebase/firebaseBackendProvider.ts`): Implemented but not wired into API routes yet.

### How to Switch Backends
1. Create a new file implementing `MixologyBackendProvider` (e.g., `firebaseBackendProvider.ts`)
2. Update `src/features/mixology/server/backend/index.ts` to import and use the new provider factory
3. No changes needed to API routes, hooks, or UI components

### API Endpoints
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/mixology/contests` | GET, POST | List all contests or create new |
| `/api/mixology/contests/[id]` | GET, PATCH, DELETE | Single contest operations |
| `/api/mixology/contests/[id]/drinks` | GET, POST | List/create drinks for a contest |
| `/api/mixology/contests/[id]/drinks/[drinkId]` | GET, PATCH, DELETE | Single drink operations |
| `/api/mixology/contests/[id]/categories` | GET, POST, PATCH | Vote category management |
| `/api/mixology/contests/[id]/scores` | GET, POST | Submit and read score entries |
| `/api/mixology/current` | GET | Fetch default contest |

### Frontend Hooks
Located in `src/features/mixology/hooks/useBackend.ts`:
- `useContests()`: Fetch all contests
- `useContest(slug)`: Fetch single contest by slug
- `useCurrentContest()`: Fetch the default contest
- `useContestMutations()`: Create, update, delete contests

## Auth & Session Layer

### Session Storage
Located in `src/features/mixology/lib/auth/storage.ts`:
- Uses localStorage for persistence (works offline, no cookie consent needed)
- Versioned storage format for future migrations
- Tracks votes, profile, sync status, and pending changes

### Auth Provider Interface
Located in `src/features/mixology/lib/auth/provider.ts`:
- `AuthProvider`: Interface for auth backends (register, login, logout, sync)
- `mockAuthProvider.ts`: In-memory mock for development
- `firebaseAuthProvider.ts`: Firebase Auth + Firestore profiles (Google + anonymous)

### Session Types (`src/features/mixology/lib/auth/types.ts`)
- `LocalSession`: Full session state (votes, profile, sync status)
- `UserVote`: Individual vote with timestamp and breakdown
- `PendingSync`: Queue of changes awaiting backend sync
- `UserProfile`: Display name, email, role

### React Integration
- `MixologyAuthProvider`: Context provider wrapping mixology routes
- `useAuth()`: Hook exposing session state and actions
- Auto-initializes from localStorage on mount
- Merges local and remote data on login

### Guest → User Flow
1. User arrives, optionally enters display name, continues anonymously (Firebase Auth)
2. Votes and actions stored locally in `LocalSession`
3. User creates account → local data synced to backend
4. Or user logs in → local guest data merged with existing account

### UI Components (`src/features/mixology/components/`)
- `GuestPrompt`: Welcome screen with guest/login/register options
- `LoginForm`: Email/password login
- `RegisterForm`: Account creation with validation
- `UserMenu`: Current user status, sync indicator, logout
- `AuthModal`: Modal wrapper for auth flows

### How to Switch to Firebase
Firebase auth provider is active in `AuthContext` and can fall back to the mock provider when Firebase is not configured.

## Firebase Integration

### Overview
Firebase is integrated for authentication (Google + anonymous) and prepared for data storage (Firestore). The configuration file is gitignored to protect credentials.

### Files
| File | Purpose |
|------|---------|
| `src/features/mixology/server/firebase/config.ts` | Firebase credentials (**GITIGNORED**) |
| `src/features/mixology/server/firebase/firebaseAuthProvider.ts` | Auth provider using Firebase Auth + Firestore for profiles |
| `src/features/mixology/server/firebase/firebaseBackendProvider.ts` | Firestore backend provider (ready for use) |
| `src/features/mixology/server/firebase/index.ts` | Module exports |

### Current Architecture
- **Client-side auth**: Uses Firebase Auth directly via `AuthContext`
- **API routes (server-side)**: Still use in-memory provider (Firebase client SDK doesn't work server-side)
- **Future**: Add Firebase Admin SDK for server-side operations, or move all data ops to client-side

### Environment Variables for Deployment (Vercel)
When deploying, set these environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
```

### Firestore Collections (planned)
| Collection | Purpose |
|------------|---------|
| `mixology_users/{uid}` | User profiles (displayName, email, role, createdAt) |
| `mixology_votes/{id}` | Vote entries (userId, contestId, drinkId, score, timestamp) |
| `mixology_contests/{id}` | Contest documents (planned) |
| `mixology_contests/{id}/drinks/{drinkId}` | Drinks as subcollection (planned) |
| `mixology_contests/{id}/judges/{judgeId}` | Judges as subcollection (planned) |
| `mixology_contests/{id}/scores/{scoreId}` | Score entries as subcollection (planned) |

### Security Rules (to be configured in Firebase Console)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Contests are readable by authenticated users
    match /contests/{contestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Admin Validation UI
A local admin dashboard at `/mixology/admin` provides:
- Contest list with phase indicators and statistics
- Detailed view of rounds, mixologists, categories, and scores for selected contests
- Local storage persistence for contest editing
- Foundation for future admin features

## Account Testing UI
The account page at `/mixology/account` provides:
- Session status and data inspection
- Guest/login/register flow testing
- Vote submission testing
- Pending sync status display

## Target End-State
- Judges and admins access the Mixology Rating App as the default experience for contests, including authentication, role-based access, drink/contest management, voting, live standings, brackets, and invite flows.
- The Shard DC calculator remains fully functional on its dedicated dc-calculator route for long-term support.
- Documentation (this file) stays current with changes, decisions, and any trade-offs made during implementation.

## Upcoming Steps (planned)
The following phases are planned for future iterations:
1. Step 8: Persist contest/round data in Firestore (wire backend provider + Admin SDK).
2. Step 9: Participant decision + role switching (default-to-voter policy).
3. Step 10: Live leaderboard, standings, and matchup winner propagation.
4. Step 11: Mixologist drink submission flow + mixer scoring rules.
5. Step 12: Invite validation API + cookie-based account creation.
6. Step 13: N/A scoring and normalization.
7. Step 14: Polishing, analytics, and documentation cleanup.
