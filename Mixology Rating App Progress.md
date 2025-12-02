# Mixology Rating App Progress

## Overview
We are introducing a contest-focused Mixology Rating App that will sit alongside the existing Shard DC calculator. The mixology experience is the primary entry point during events, while the legacy calculator remains available on a secondary route for returning users and archival workflows.

## Step Log
- **Step 1 (Scaffolding and coexistence)**: Completed. Added dedicated mixology routing and navigation while preserving the legacy calculator on a separate path. Future steps (2–9) are planned but not implemented yet.

## Architectural Decisions
- **Routing structure**: The mixology experience lives under `/mixology`, with the landing page at `/`. This ensures contest participants arrive at the mixology shell by default while keeping the new flow isolated from legacy code paths.
- **Legacy exposure**: The original Shard DC calculator now resides at `/legacy`. It is linked from the global header as a secondary action so it remains discoverable without overshadowing the contest experience.
- **Navigation and layouts**: A shared header in `app/layout.tsx` highlights the mixology app as primary and provides a secondary link to the legacy calculator. The main content area uses a neutral container that supports both the new shell and legacy UI without altering existing calculator components.
- **Feature placement**: Future mixology features (admin tools, voting, standings, brackets, invites) should be added within the `/mixology` route and associated subdirectories. Any new API routes or server actions should be namespaced for mixology to avoid collisions with calculator logic.
- **Constraints/assumptions**: Legacy calculator behavior and styling should remain untouched aside from the navigation wrapper. Mixology additions should avoid modifying shared legacy styles; instead, prefer scoped styles or new modules under the mixology tree.

## Target End-State
- Judges and admins access the Mixology Rating App as the default experience for contests, including authentication, role-based access, drink/contest management, voting, live standings, brackets, and invite flows.
- The Shard DC calculator remains fully functional on its dedicated route for long-term support.
- Documentation (this file) stays current with changes, decisions, and any trade-offs made during implementation.

## Upcoming Steps (planned)
The following phases are planned for future iterations:
1. Step 2: Data model and backend foundation.
2. Step 3: Authentication, roles, and basic access control.
3. Step 4: Contest and drink management (admin only).
4. Step 5: Current drink flow and basic voting.
5. Step 6: Live leaderboard and standings overview.
6. Step 7: Bracket modeling and display.
7. Step 8: Invite URL and cookie-based account creation flow.
8. Step 9: Polishing, analytics, and documentation cleanup.
