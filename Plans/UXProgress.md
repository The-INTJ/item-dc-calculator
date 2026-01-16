# UX Progress

This document tracks UX and component implementation milestones for the Mixology Rating App and legacy isolation. Each item is small, testable, and scoped to one behavior or surface. Check items off as they land.

## Legend
- ✅ Done
- 🟡 In progress
- ⬜ Not started

---

## Phase 0 — Current state assessment
- ✅ Mixology routes exist under `/mixology`.
- ✅ Legacy routes exist under `/legacy`.
- ✅ Auth context and session management exist.
- ✅ Legacy is not linked from mixology navigation.
- ⬜ Mixology navbar is generic (not minimal).
- ⬜ Landing page does not show role-based widgets.

---

## Phase 1 — Legacy isolation

### 1.1 Remove legacy links from mixology
- ✅ Remove any navbar links pointing to `/legacy` from mixology layout.
- ✅ Ensure mixology layout does not import legacy navbar.
- ✅ Verify `/legacy` is only accessible via direct URL.

### 1.2 Legacy navbar containment
- ✅ Confirm legacy navbar is scoped to legacy layout only.
- ✅ Remove legacy navbar from any shared components.
- ✅ Test that navigating to `/legacy` shows legacy navbar, not mixology navbar.

---

## Phase 2 — Mixology navbar

### 2.1 Create minimal MixologyNavbar
- ⬜ Create `MixologyNavbar` component.
- ⬜ Add centered title/branding.
- ⬜ Add user display name on right.
- ⬜ Add logout button on right.
- ⬜ Remove all other navigation links.

### 2.2 Integrate MixologyNavbar
- ⬜ Replace existing navbar in mixology layout with `MixologyNavbar`.
- ⬜ Ensure navbar height is compact (48–56px).
- ⬜ Style using semantic tokens from theme.

---

## Phase 3 — Landing page widgets

### 3.1 Unauthenticated landing
- ⬜ Create `WidgetCard` component for CTAs.
- ⬜ Show "Create Account" / "Login" widgets.
- ⬜ Show "Continue as Guest" widget.
- ⬜ Center layout with branding.

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
- ⬜ Create `ContestContext` provider.
- ⬜ Fetch current contest data.
- ⬜ Expose contest, drinks, and loading state.
- ⬜ Add hook `useContest` for consuming context.

### 4.2 RoundContext
- ⬜ Create `RoundContext` provider.
- ⬜ Fetch active round and matchups.
- ⬜ Expose round, matchups, and voting status.
- ⬜ Add hook `useRound` for consuming context.

### 4.3 AdminContext
- ⬜ Create `AdminContext` provider (admin pages only).
- ⬜ Expose admin actions (advance round, update matchup).
- ⬜ Guard against non-admin access.

---

## Phase 5 — Bracket system

### 5.1 Library selection
- ⬜ Evaluate `react-brackets` for suitability.
- ⬜ Evaluate `react-tournament-bracket` for suitability.
- ⬜ Decide on library or custom implementation.
- ⬜ Document decision in UXPlan.md.

### 5.2 Bracket data model
- ⬜ Define `Round` type with round number, status, matchups.
- ⬜ Define `Matchup` type with drink pairs and winner.
- ⬜ Add rounds array to contest model.
- ⬜ Update backend types.

### 5.3 BracketView component
- ⬜ Create `BracketView` component.
- ⬜ Render rounds and matchups.
- ⬜ Highlight current/active round.
- ⬜ Show winners for completed matchups.

### 5.4 MatchupCard component
- ⬜ Create `MatchupCard` component.
- ⬜ Display two drinks in matchup.
- ⬜ Show scores or "pending" state.
- ⬜ Highlight winner.

---

## Phase 6 — Voting flow

### 6.1 Vote page structure
- ✅ Create `/mixology/vote` page.
- ✅ Fetch current round drinks.
- ✅ Display list of `DrinkCard` components.
- ⬜ Link each card to `/mixology/vote/[drinkId]`.

### 6.2 DrinkCard component
- ✅ Create `DrinkCard` component.
- 🟡 Display drink name, image, mixer.
- ⬜ Show voting status (voted/not voted).
- ⬜ Style using semantic tokens.

### 6.3 Score input page
- ⬜ Create `/mixology/vote/[drinkId]` page.
- ⬜ Create `ScoreInput` component with N/A support.
- ✅ Submit scores to backend.
- ⬜ Navigate back to vote list on submit.

### 6.4 RoundIndicator component
- ⬜ Create `RoundIndicator` component.
- ⬜ Display current round name/number.
- ⬜ Show round status (voting open/closed).

---

## Phase 7 — Admin pages

### 7.1 Admin dashboard
- ⬜ Create `/mixology/admin` page.
- ⬜ Create `AdminSidebar` component.
- ⬜ Show stats overview (users, votes, drinks).
- ⬜ Link to admin sub-pages.

### 7.2 Round management
- ⬜ Create `/mixology/admin/rounds` page.
- ⬜ List all rounds with status.
- ⬜ Allow setting active round.
- ⬜ Allow advancing to next round.

### 7.3 Matchup management
- ⬜ Display matchups for selected round.
- ⬜ Allow marking matchup winner.
- ⬜ Auto-advance winner to next round.

### 7.4 Drink management
- ⬜ Create `/mixology/admin/drinks` page.
- ⬜ List all drinks with mixer info.
- ⬜ Allow creating/editing drinks.
- ⬜ Allow assigning drinks to rounds.

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
- ⬜ Ensure all interactive elements are keyboard accessible.
- ⬜ Add focus states from theme tokens.
- ⬜ Test tab order on all pages.

### 9.2 Loading states
- ⬜ Add loading skeletons for widgets.
- ⬜ Add loading states for bracket/vote pages.
- ⬜ Ensure no layout shift on load.

### 9.3 Error states
- ⬜ Add error boundaries for page crashes.
- ⬜ Show user-friendly error messages.
- ⬜ Allow retry on failed data fetches.

---

## Notes
- UXPlan.md is the source of truth for architecture decisions.
- Components should be theme-aware per DEV_STANDARDS.md.
- Bracket library decision blocks Phase 5.3+.
- Admin pages require admin role enforcement.
