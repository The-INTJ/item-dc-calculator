# UX Progress

This document tracks UX and component implementation milestones for the Mixology Rating App and dc-calculator coexistence. Each item is small, testable, and scoped to one behavior or surface. Check items off as they land.

## Legend
- ✅ Done
- 🟡 In progress
- ⬜ Not started

---

## Phase 0 — Current state assessment
- ✅ Mixology routes exist under `/mixology`.
- ✅ DC-calculator routes exist under `/dc-calculator`.
- ✅ Auth context and session management exist.
- ✅ DC-calculator route remains available alongside mixology routes.
- ✅ `SiteHeader` + `NavBar` render for mixology routes with contest state badge.
- ⬜ Landing page does not show role-based widgets.

---

## Phase 1 — DC-calculator coexistence

### 1.1 Clarify dc-calculator access
- ✅ Ensure nav links can surface `/dc-calculator` alongside mixology layout.
- ✅ Keep mixology layout independent from dc-calculator navigation.
- ✅ Verify `/dc-calculator` remains accessible as a peer route.

### 1.2 DC-calculator navbar containment
- ✅ Confirm dc-calculator navbar is scoped to the dc-calculator layout only.
- ✅ Remove dc-calculator navbar from any shared components.
- ✅ Test that navigating to `/dc-calculator` shows dc-calculator navbar, not mixology navbar.

---

## Phase 2 — Mixology navbar

### 2.1 Current navigation
- ✅ `SiteHeader` renders branding and contest-state badge.
- ✅ `NavBar` links to mixology home, vote, bracket, account, and admin (admin-only).
- ✅ Auth banner appears on gated routes for signed-out users.

### 2.2 Minimal MixologyNavbar (original concept)
- ⬜ Create minimal `MixologyNavbar` component.
- ⬜ Add centered title/branding.
- ⬜ Add user display name on right.
- ⬜ Add logout button on right.
- ⬜ Remove all other navigation links.

---

## Phase 3 — Landing page widgets

### 3.1 Unauthenticated landing
- 🟡 Landing hero and primary CTA implemented.
- ⬜ Create `WidgetCard` component for CTAs.
- ⬜ Show "Create Account" / "Login" widgets.
- ⬜ Show "Continue as Guest" widget.

### 3.2 Authenticated landing
- ⬜ Show "Vote on Drinks" widget (all users).
- ⬜ Show "Enter as Mixologist" widget (all users).
- ⬜ Show "View Bracket" widget (all users).
- ⬜ Show "Admin Dashboard" widget (admins only).

### 3.3 RoleGate component
- ⬜ Create `RoleGate` component for conditional rendering.
- ⬜ Accept `roles` prop to specify allowed roles.
- ⬜ Hide children if user role does not match.
- ⬜ Add tests for role gating logic.

---

## Phase 4 — Context providers

### 4.1 ContestContext
- ✅ `MixologyDataContext` provides contest, rounds, and drink summaries.
- ✅ `ContestStateContext` provides lifecycle state (Debug/Set/Shake/Scored).

### 4.2 RoundContext
- ⬜ Create `RoundContext` provider (if needed for server-backed rounds).
- ⬜ Fetch active round and matchups.
- ⬜ Expose round, matchups, and voting status.

### 4.3 AdminContext
- ✅ `AdminContestContext` provides local contest CRUD and round controls.
- ⬜ Add server-backed admin actions once Admin SDK is ready.

---

## Phase 5 — Bracket system

### 5.1 Library selection
- ✅ Chose custom bracket rendering (`BracketView`).
- ✅ Documented mapping helper (`buildBracketRoundsFromContest`).

### 5.2 Bracket data model
- ✅ Contest rounds model exists (`ContestRound` in mixology types).
- ✅ Contest includes rounds array and active round.

### 5.3 BracketView component
- ✅ `BracketView` component renders rounds + matchups.
- ✅ Highlights current/active round.
- ⬜ Show winners for completed matchups (requires data).

### 5.4 MatchupCard component
- ✅ Matchup cards render matchup entries within `BracketView`.
- ⬜ Display scores or "pending" state (once scoring data wired).

---

## Phase 6 — Voting flow

### 6.1 Vote page structure
- ✅ Create `/mixology/vote` page.
- ✅ Fetch current round drinks and categories.
- ✅ Display list of `DrinkCard` components.
- ⬜ Link each card to `/mixology/vote/[drinkId]` (planned).

### 6.2 DrinkCard component
- ✅ Display drink name, creator, totals.
- ✅ Supports vote and compact variants.
- ⬜ Add voted/not voted status badge.

### 6.3 Score input page
- ✅ Inline `VoteScorePanel` supports per-category sliders and submission.
- ⬜ Create `/mixology/vote/[drinkId]` page (if we switch to per-drink flow).
- ⬜ Add N/A support.

### 6.4 RoundIndicator component
- ⬜ Create `RoundIndicator` component.
- ⬜ Display current round name/number.
- ⬜ Show round status (voting open/closed).

---

## Phase 7 — Admin pages

### 7.1 Admin dashboard
- ✅ `/mixology/admin` page exists.
- ✅ Contest list, contest details, categories, mixologists, rounds.
- ✅ Contest state controls in admin UI.

### 7.2 Round management
- ✅ Add/update/remove rounds in admin dashboard.
- ✅ Set active round and round state in admin dashboard.

### 7.3 Matchup management
- ⬜ Display matchups for selected round.
- ⬜ Allow marking matchup winner.
- ⬜ Auto-advance winner to next round.

### 7.4 Drink management
- ✅ Mixologist + drink management in admin dashboard.
- ⬜ Create `/mixology/admin/drinks` standalone page (optional).

### 7.5 User management
- ⬜ Create `/mixology/admin/users` page.
- ⬜ List all users with roles.
- ⬜ Allow role assignment (user → admin).
- ⬜ Show vote counts per user.

---

## Phase 8 — Mixologist flow

### 8.1 Drink creation page
- ⬜ Create `/mixology/create` page.
- ⬜ Form for drink name, description, image.
- ⬜ Submit drink to backend.
- ⬜ Auto-mark current user as mixer.

### 8.2 Mixer indicator
- ⬜ Display "You are the mixer" badge on drink.
- ⬜ Block voting UI for mixer's own drink.
- ⬜ Show auto-assigned full score.

---

## Phase 9 — Polish and accessibility

### 9.1 Keyboard navigation
- ⬜ Audit focus states and keyboard controls.
- ⬜ Add focus-visible styles for key widgets.

### 9.2 Accessibility review
- ⬜ Screen reader labels for key actions.
- ⬜ Color contrast audit.
- ⬜ Reduced motion checks.
