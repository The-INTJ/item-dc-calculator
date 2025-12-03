# Mixology Rating App Progress

## Overview
We are introducing a contest-focused Mixology Rating App that will sit alongside the existing Shard DC calculator. The mixology experience is the primary entry point during events, while the legacy calculator remains available on a secondary route for returning users and archival workflows.

## Step Log
- **Step 1 (Scaffolding and coexistence)**: Completed. Added dedicated mixology routing and navigation while preserving the legacy calculator on a separate path.
- **Step 2 (Data model and backend foundation)**: Completed. Defined typed contest/drink/judge/score schemas with seeded data, plus read-only API at `/api/mixology/contests`.
- **Step 2.5 (Backend abstraction layer)**: Completed. Created a provider-based abstraction layer enabling seamless switching between in-memory, Firebase, or other backends without modifying frontend code. Added full CRUD API endpoints and basic admin validation UI.

## Architectural Decisions
- **Routing structure**: The mixology experience lives under `/mixology`, with the landing page at `/`. This ensures contest participants arrive at the mixology shell by default while keeping the new flow isolated from legacy code paths.
- **Legacy exposure**: The original Shard DC calculator now resides at `/legacy`. It is linked from the global header as a secondary action so it remains discoverable without overshadowing the contest experience.
- **Navigation and layouts**: A shared header in `app/layout.tsx` highlights the mixology app as primary and provides a secondary link to the legacy calculator. The main content area uses a neutral container that supports both the new shell and legacy UI without altering existing calculator components.
- **Feature placement**: Future mixology features (admin tools, voting, standings, brackets, invites) should be added within the `/mixology` route and associated subdirectories. Any new API routes or server actions should be namespaced for mixology to avoid collisions with calculator logic.
- **Constraints/assumptions**: Legacy calculator behavior and styling should remain untouched aside from the navigation wrapper. Mixology additions should avoid modifying shared legacy styles; instead, prefer scoped styles or new modules under the mixology tree.
- **Backend provider pattern**: All data access goes through `MixologyBackendProvider` interface (`src/mixology/backend/types.ts`). To switch backends (e.g., from in-memory to Firebase), implement the provider interface and swap the factory call in `src/mixology/backend/index.ts`. Frontend hooks and API routes remain unchanged.

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

## Admin Validation UI
A basic admin dashboard at `/mixology/admin` provides:
- Contest list with phase indicators and statistics
- Detailed view of drinks, judges, and scores for selected contests
- Refresh functionality to verify backend integration
- Foundation for future admin features

## Target End-State
- Judges and admins access the Mixology Rating App as the default experience for contests, including authentication, role-based access, drink/contest management, voting, live standings, brackets, and invite flows.
- The Shard DC calculator remains fully functional on its dedicated route for long-term support.
- Documentation (this file) stays current with changes, decisions, and any trade-offs made during implementation.

## Upcoming Steps (planned)
The following phases are planned for future iterations:
1. Step 3: Authentication, roles, and basic access control.
2. Step 4: Contest and drink management (admin only).
3. Step 5: Current drink flow and basic voting.
4. Step 6: Live leaderboard and standings overview.
5. Step 7: Bracket modeling and display.
6. Step 8: Invite URL and cookie-based account creation flow.
7. Step 9: Polishing, analytics, and documentation cleanup.
