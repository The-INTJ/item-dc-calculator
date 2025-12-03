# Mixology Rating App Progress

## Overview
We are introducing a contest-focused Mixology Rating App that will sit alongside the existing Shard DC calculator. The mixology experience is the primary entry point during events, while the legacy calculator remains available on a secondary route for returning users and archival workflows.

## Step Log
- **Step 1 (Scaffolding and coexistence)**: Completed. Added dedicated mixology routing and navigation while preserving the legacy calculator on a separate path.
- **Step 2 (Data model and backend foundation)**: Completed. Defined typed contest/drink/judge/score schemas with seeded data, plus read-only API at `/api/mixology/contests`.
- **Step 2.5 (Backend abstraction layer)**: Completed. Created a provider-based abstraction layer enabling seamless switching between in-memory, Firebase, or other backends without modifying frontend code. Added full CRUD API endpoints and basic admin validation UI.
- **Step 3 (Guest/user session management)**: Completed. Built localStorage-based session persistence, guest mode with optional account creation, and auth provider abstraction for future Firebase integration.
- **Step 4 (Firebase integration)**: Completed. Integrated Firebase Auth for user authentication and prepared Firestore backend provider. Client-side auth fully operational; API routes continue using in-memory provider for now (server-side Firebase Admin SDK planned for future).

## Architectural Decisions
- **Routing structure**: The mixology experience lives under `/mixology`, with the landing page at `/`. This ensures contest participants arrive at the mixology shell by default while keeping the new flow isolated from legacy code paths.
- **Legacy exposure**: The original Shard DC calculator now resides at `/legacy`. It is linked from the global header as a secondary action so it remains discoverable without overshadowing the contest experience.
- **Navigation and layouts**: A shared header in `app/layout.tsx` highlights the mixology app as primary and provides a secondary link to the legacy calculator. The main content area uses a neutral container that supports both the new shell and legacy UI without altering existing calculator components.
- **Feature placement**: Future mixology features (admin tools, voting, standings, brackets, invites) should be added within the `/mixology` route and associated subdirectories. Any new API routes or server actions should be namespaced for mixology to avoid collisions with calculator logic.
- **Constraints/assumptions**: Legacy calculator behavior and styling should remain untouched aside from the navigation wrapper. Mixology additions should avoid modifying shared legacy styles; instead, prefer scoped styles or new modules under the mixology tree.
- **Backend provider pattern**: All data access goes through `MixologyBackendProvider` interface (`src/mixology/backend/types.ts`). To switch backends (e.g., from in-memory to Firebase), implement the provider interface and swap the factory call in `src/mixology/backend/index.ts`. Frontend hooks and API routes remain unchanged.
- **Session/auth pattern**: User sessions are stored in localStorage with a provider abstraction for authentication. Guest users can vote and their data persists locally. When they create an account, local data is migrated to the backend. The auth provider can be swapped from mock to Firebase without changing any UI code.

## Backend Abstraction Layer

### Provider Interface
Located in `src/mixology/backend/types.ts`, the abstraction defines:
- `ContestsProvider`: CRUD operations for contests
- `DrinksProvider`: Manage drinks within contests
- `JudgesProvider`: Manage judges within contests
- `ScoresProvider`: Submit and manage ratings
- `MixologyBackendProvider`: Aggregates all sub-providers with init/dispose lifecycle

### Current Implementation
- **In-Memory Provider** (`src/mixology/backend/inMemoryProvider.ts`): Stores data in memory using seed data. Perfect for local development and testing.

### How to Switch Backends
1. Create a new file implementing `MixologyBackendProvider` (e.g., `firebaseProvider.ts`)
2. Update `src/mixology/backend/index.ts` to import and use the new provider factory
3. No changes needed to API routes, hooks, or UI components

### API Endpoints
| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/mixology/contests` | GET, POST | List all contests or create new |
| `/api/mixology/contests/[id]` | GET, PATCH, DELETE | Single contest operations |
| `/api/mixology/contests/[id]/drinks` | GET, POST | List/create drinks for a contest |
| `/api/mixology/contests/[id]/drinks/[drinkId]` | GET, PATCH, DELETE | Single drink operations |

### Frontend Hooks
Located in `src/mixology/hooks/useBackend.ts`:
- `useContests()`: Fetch all contests
- `useContest(slug)`: Fetch single contest by slug
- `useCurrentContest()`: Fetch the default contest
- `useContestMutations()`: Create, update, delete contests

## Auth & Session Layer

### Session Storage
Located in `src/mixology/auth/storage.ts`:
- Uses localStorage for persistence (works offline, no cookie consent needed)
- Versioned storage format for future migrations
- Tracks votes, profile, sync status, and pending changes

### Auth Provider Interface
Located in `src/mixology/auth/provider.ts`:
- `AuthProvider`: Interface for auth backends (register, login, logout, sync)
- `mockAuthProvider.ts`: In-memory mock for development
- Ready for `firebaseAuthProvider.ts` implementation

### Session Types (`src/mixology/auth/types.ts`)
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
1. User arrives, optionally enters display name, continues as guest
2. Votes and actions stored locally in `LocalSession`
3. User creates account → local data synced to backend
4. Or user logs in → local guest data merged with existing account

### UI Components (`app/mixology/components/`)
- `GuestPrompt`: Welcome screen with guest/login/register options
- `LoginForm`: Email/password login
- `RegisterForm`: Account creation with validation
- `UserMenu`: Current user status, sync indicator, logout
- `AuthModal`: Modal wrapper for auth flows

### How to Switch to Firebase
1. Create `src/mixology/auth/firebaseAuthProvider.ts` implementing `AuthProvider`
2. Update `src/mixology/auth/AuthContext.tsx` to use Firebase provider
3. No changes needed to UI components or session logic

## Firebase Integration

### Overview
Firebase is integrated for authentication (Firebase Auth) and prepared for data storage (Firestore). The configuration file is gitignored to protect credentials.

### Files
| File | Purpose |
|------|---------|
| `src/mixology/firebase/config.ts` | Firebase credentials (**GITIGNORED**) |
| `src/mixology/firebase/firebaseAuthProvider.ts` | Auth provider using Firebase Auth + Firestore for profiles |
| `src/mixology/firebase/firebaseBackendProvider.ts` | Firestore backend provider (ready for use) |
| `src/mixology/firebase/index.ts` | Module exports |

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
| `users/{uid}` | User profiles (displayName, email, role, createdAt) |
| `contests/{id}` | Contest documents |
| `contests/{id}/drinks/{drinkId}` | Drinks as subcollection |
| `contests/{id}/judges/{judgeId}` | Judges as subcollection |
| `contests/{id}/scores/{scoreId}` | Score entries as subcollection |

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
A basic admin dashboard at `/mixology/admin` provides:
- Contest list with phase indicators and statistics
- Detailed view of drinks, judges, and scores for selected contests
- Refresh functionality to verify backend integration
- Foundation for future admin features

## Account Testing UI
The account page at `/mixology/account` provides:
- Session status and data inspection
- Guest/login/register flow testing
- Vote submission testing
- Pending sync status display

## Target End-State
- Judges and admins access the Mixology Rating App as the default experience for contests, including authentication, role-based access, drink/contest management, voting, live standings, brackets, and invite flows.
- The Shard DC calculator remains fully functional on its dedicated route for long-term support.
- Documentation (this file) stays current with changes, decisions, and any trade-offs made during implementation.

## Upcoming Steps (planned)
The following phases are planned for future iterations:
1. ~~Step 3: Authentication, roles, and basic access control.~~ ✓ Completed
2. ~~Step 4: Firebase integration (auth provider + data provider).~~ ✓ Completed
3. Step 5: Contest and drink management (admin only).
4. Step 6: Current drink flow and basic voting UI.
5. Step 7: Live leaderboard and standings overview.
6. Step 8: Bracket modeling and display.
7. Step 9: Invite URL and cookie-based account creation flow.
8. Step 10: Polishing, analytics, and documentation cleanup.
