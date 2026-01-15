# UX Plan

## Scope and intent
This document outlines the component architecture and user experience plan for the Mixology Rating App and the legacy D&D calculator. It focuses on navigation, page structure, user flows, and component responsibilities. No code changes are proposed here.

## Context
- This project started as a **D&D calculator** ("legacy app").
- The **Mixology Rating App** was added as a learning exercise in architecture and full-stack development.
- The two apps are architecturally separate and should remain so.
- The legacy app should be hidden from casual discovery; only direct URL access (`/legacy`) should reach it.
- Mixology is the primary, default experience.

## Goals
- Establish clear entry points and navigation for mixology users.
- Hide the legacy D&D app from the default experience.
- Create a minimal, focused navbar for mixology.
- Build a bracket/tournament system for drink competitions.
- Support distinct user flows for guests, authenticated users, mixologists, and admins.
- Provide admin tooling for round/bracket management.

## Guiding principles
1. Default experience is mixology; legacy is hidden.
2. Navbar should be minimal—logout, user name, centered title.
3. User roles drive widget visibility (guest, user, judge, mixologist, admin).
4. Component composition over monolithic pages.
5. Context providers manage global state (auth, contest, round).

---

## Information architecture

### Route structure
| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Mixology landing (default home) | Public |
| `/mixology` | Mixology landing (alias) | Public |
| `/mixology/account` | Account management (login/register/logout) | Public |
| `/mixology/onboard` | Guest onboarding flow | Public |
| `/mixology/vote` | Voting interface for current round | Authenticated |
| `/mixology/vote/[drinkId]` | Individual drink scoring | Authenticated |
| `/mixology/create` | Mixologist drink submission | Authenticated (mixologist) |
| `/mixology/bracket` | View tournament bracket | Authenticated |
| `/mixology/admin` | Admin dashboard | Admin only |
| `/mixology/admin/rounds` | Round/bracket management | Admin only |
| `/mixology/admin/drinks` | Drink management | Admin only |
| `/mixology/admin/users` | User management | Admin only |
| `/legacy` | D&D calculator (hidden) | Direct URL only |

### Navigation visibility
- **Legacy app**: No external links. Only accessible via `/legacy`. The legacy navbar remains internal to the legacy layout.
- **Mixology app**: Minimal navbar with logout, user display name, and centered title.

---

## Landing page UX (unauthenticated)

### Layout
- Centered branding/title.
- Two primary CTAs:
  - **"Create Account"** or **"Login"** (if not authenticated).
  - **"Continue as Guest"** (creates guest session).

### Post-auth landing (authenticated)

Once authenticated, the landing page shows role-based widgets:

| Widget | Visible to | Action |
|--------|------------|--------|
| "Vote on Drinks" | All authenticated users | Navigate to `/mixology/vote` |
| "Enter as Mixologist" | All authenticated users | Navigate to `/mixology/create` |
| "View Bracket" | All authenticated users | Navigate to `/mixology/bracket` |
| "Admin Dashboard" | Admins only | Navigate to `/mixology/admin` |

---

## Navbar design

### Mixology navbar
- **Left**: Empty or minimal branding.
- **Center**: Contest/app title.
- **Right**: User display name + logout button.
- Height: Compact (approx 48–56px).
- No links to legacy.

### Legacy navbar
- Stays as-is within the legacy layout.
- Not visible anywhere in the mixology experience.
- Legacy layout wraps legacy routes only.

---

## Bracket system

### Requirements
- Display tournament bracket for a contest.
- Support multiple rounds (e.g., Round 1, Semifinals, Finals).
- Show matchups and winners.
- Admin can advance drinks between rounds.

### Library options (to evaluate)
- `react-brackets` — simple bracket rendering.
- `react-tournament-bracket` — SVG-based bracket.
- Custom implementation using MUI Grid/Flexbox.

### Data model needs
- `Round` entity with round number, status, matchups.
- `Matchup` entity with drink pairs and winner.
- Contest has ordered list of rounds.

### Admin controls
- Create/edit rounds.
- Set current active round.
- Mark matchup winners.
- Advance to next round.

---

## Context providers

### Existing
- `AuthContext` — user session, auth state.

### Planned
| Context | Purpose |
|---------|---------|
| `ContestContext` | Current contest data, drinks, rounds. |
| `RoundContext` | Active round, matchups, voting status. |
| `AdminContext` | Admin-specific state and actions. |

### Provider hierarchy
```
<AuthProvider>
  <ContestProvider>
    <RoundProvider>
      <MixologyLayout>
        {children}
      </MixologyLayout>
    </RoundProvider>
  </ContestProvider>
</AuthProvider>
```

---

## Component inventory

### Shared/lib components (to build)
| Component | Purpose |
|-----------|---------|
| `MixologyNavbar` | Minimal navbar for mixology |
| `UserBadge` | Display name + avatar |
| `LogoutButton` | Styled logout action |
| `RoleGate` | Conditionally render children based on role |
| `WidgetCard` | Landing page action widget |
| `BracketView` | Tournament bracket visualization |
| `MatchupCard` | Single matchup in bracket |
| `RoundIndicator` | Show current round status |
| `DrinkCard` | Drink display for voting/viewing |
| `ScoreInput` | Score entry UI with N/A support |
| `AdminSidebar` | Admin navigation sidebar |

### Page components
| Page | Components used |
|------|-----------------|
| Landing (unauth) | `WidgetCard` (login/register/guest) |
| Landing (auth) | `WidgetCard` (vote/create/bracket/admin) |
| Vote | `DrinkCard`, `ScoreInput`, `RoundIndicator` |
| Bracket | `BracketView`, `MatchupCard`, `RoundIndicator` |
| Admin Dashboard | `AdminSidebar`, `RoundIndicator`, stats |
| Admin Rounds | `MatchupCard`, round controls |

---

## User flows

### Guest flow
1. Land on `/` or `/mixology`.
2. Click "Continue as Guest".
3. Guest session created, redirected to `/mixology/vote` or landing with widgets.
4. Can vote on drinks.
5. Prompted to register to save votes permanently.

### Registered user flow
1. Land on `/` or `/mixology`.
2. Click "Login" or "Create Account".
3. Authenticate via Firebase (email/password or Google).
4. Redirected to landing with role-based widgets.
5. Full access to voting, bracket, and drink creation.

### Mixologist flow
1. Authenticate.
2. Click "Enter as Mixologist".
3. Navigate to `/mixology/create`.
4. Submit drink entry.
5. Drink marked with mixer (auto-scored).

### Admin flow
1. Authenticate (must have admin role).
2. See "Admin Dashboard" widget on landing.
3. Navigate to `/mixology/admin`.
4. Manage rounds, drinks, users.
5. Advance bracket, set active round.

---

## Legacy app isolation

### Current state
- Legacy routes exist under `/legacy` but may be linked from main navbar.

### Target state
- No links to legacy from mixology.
- Legacy navbar is internal to legacy layout only.
- Accessing legacy is via direct URL knowledge only.
- Consider removing legacy from sitemap/robots if public.

---

## Open questions
- Which bracket library to use (or custom)?
- Should admins be able to create multiple concurrent contests?
- Do we need real-time bracket updates (WebSocket/Firestore listeners)?
- Should the bracket be public or auth-only?

---

## Next steps
1. Remove navbar links to legacy from mixology.
2. Implement minimal `MixologyNavbar`.
3. Build role-based widget cards for landing.
4. Create `ContestContext` and `RoundContext`.
5. Evaluate and select bracket library.
6. Scaffold admin pages.
7. Build voting flow pages.
