# UX Plan

## Scope and intent
This document outlines the component architecture and user experience plan for the Mixology Rating App and the legacy D&D calculator. It focuses on navigation, page structure, user flows, and component responsibilities. No code changes are proposed here.

## Context
- This project started as a **D&D calculator** ("legacy app").
- The **Mixology Rating App** was added as a learning exercise in architecture and full-stack development.
- The two apps are architecturally separate and should remain so.
- The legacy app should be hidden from casual discovery; only direct URL access (`/legacy`) should reach it.
- Mixology is the primary, default experience.

## Progress tracker
See [UX Progress](UXProgress.md) for the current status of UX-related tasks and decisions.

## Goals
- Establish clear entry points and navigation for mixology users.
- Hide the legacy D&D app from the default experience.
- Provide a focused navbar that highlights contest state and key routes.
- Build a bracket/tournament system for drink competitions.
- Support distinct user flows for guests, authenticated users, mixologists, and admins.
- Provide admin tooling for round/bracket management.

## Guiding principles
1. Default experience is mixology; legacy is hidden.
2. Navbar should stay focused and communicate contest state.
3. User roles drive widget visibility (guest, user, mixologist, admin).
4. Component composition over monolithic pages.
5. Context providers manage global state (auth, contest, admin).

---

## Information architecture

### Route structure
| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Mixology landing (default home) | Public |
| `/mixology` | Mixology landing (alias) | Public |
| `/mixology/account` | Account management (login/register/logout) | Public |
| `/mixology/onboard` | Guest onboarding flow | Public |
| `/mixology/vote` | Voting interface for current round | Public (guest + authenticated) |
| `/mixology/vote/[drinkId]` | Individual drink scoring | Planned |
| `/mixology/create` | Mixologist drink submission | Planned |
| `/mixology/bracket` | View tournament bracket | Public (guest + authenticated) |
| `/mixology/admin` | Admin dashboard | Admin only |
| `/mixology/admin/rounds` | Round/bracket management | Planned (currently in admin dashboard) |
| `/mixology/admin/drinks` | Drink management | Planned (currently in admin dashboard) |
| `/mixology/admin/users` | User management | Planned |
| `/legacy` | D&D calculator (hidden) | Direct URL only |

### Navigation visibility
- **Legacy app**: No external links. Only accessible via `/legacy`. The legacy navbar remains internal to the legacy layout.
- **Mixology app**: `SiteHeader` renders for `/` and `/mixology/*` routes, with `NavBar` links, contest state badge, and an auth banner for protected pages.

---

## Landing page UX (current)

### Layout
- Centered branding/title with hero copy.
- Primary CTA routes to onboarding (AuthPrimaryAction).
- Admin CTA shown only to admins.

### Planned enhancements
- Role-based widgets for authenticated users (vote, mixologist, bracket, admin).
- A "Continue as Guest" widget on the landing page (currently hosted on `/mixology/onboard`).

---

## Navbar design

### Status note
The current navbar (`SiteHeader` + `NavBar`) includes route links and contest state. The original plan for a minimal title/username/logout-only navbar is not implemented yet.

### Current navbar
- **Branding**: "Mixology Rating App" label.
- **Links**: Mixology home, vote, bracket, account, admin (admin-only).
- **Status**: Contest phase badge showing Debug/Set/Shake/Scored.
- **Auth banner**: Appears on gated routes for signed-out users.

---

## Bracket system

### Current implementation
- `BracketView` renders rounds derived from contest data.
- `BracketClient` fetches contest via `MixologyDataContext` and maps rounds to bracket rows.
- No winner propagation or matchup management yet.

### Planned enhancements
- Add matchup winners and advancement logic.
- Add admin controls for matchup outcomes.

---

## Context providers

### Existing
- `AuthContext` — user session, auth state.
- `ContestStateContext` — contest lifecycle state (Debug/Set/Shake/Scored).
- `AdminContestContext` — local admin contest editing + round state.
- `MixologyDataContext` — contest data, round summaries, drink summaries.

### Planned
- `RoundContext` for per-round data (if needed when server backing is ready).
- `AdminContext` with server-backed admin actions.

### Provider hierarchy (current)
```
<MixologyAuthProvider>
  <ContestStateProvider>
    <SiteHeader />
    <AdminContestProvider>
      <MixologyDataProvider>
        {children}
      </MixologyDataProvider>
    </AdminContestProvider>
  </ContestStateProvider>
</MixologyAuthProvider>
```

---

## Component inventory

### Shared/lib components (current)
| Component | Purpose |
|-----------|---------|
| `SiteHeader` | Branding, nav links, auth banner, contest state badge |
| `NavBar` | Mixology links + contest phase status |
| `DrinkCard` | Drink display for voting/viewing |
| `RoundCard` | Round summary display |
| `BracketView` | Tournament bracket visualization |
| `VoteScorePanel` | Inline score inputs + totals |
| `VoteCategoryTabs` | Category filters (admin) |
| `AdminDashboard` + subcomponents | Contest, round, mixologist, category management |

### Planned components
| Component | Purpose |
|-----------|---------|
| `MixologyNavbar` | Minimal navbar for mixology (if we pivot back to original concept) |
| `RoleGate` | Conditionally render children based on role |
| `WidgetCard` | Landing page action widget |
| `RoundIndicator` | Show current round status |
| `ScoreInput` | Score entry UI with N/A support |
| `AdminSidebar` | Admin navigation sidebar |

---

## User flows

### Guest flow (current)
1. Land on `/` or `/mixology`.
2. Click CTA to open `/mixology/onboard`.
3. Enter display name and continue anonymously (Firebase Auth).
4. Redirected to `/mixology/vote`.
5. Votes stored locally and submitted to API.

### Registered user flow (current)
1. Land on `/` or `/mixology`.
2. Click CTA to open `/mixology/onboard`.
3. Authenticate via Firebase (Google).
4. Redirected to `/mixology/vote`.

### Admin flow (current)
1. Authenticate via Firebase and receive admin role.
2. Open `/mixology/admin` to manage contests, rounds, categories, and mixologists.
3. Use contest state controls (Debug/Set/Shake/Scored) to gate voting.

### Planned flows
- Participant Decision step after onboarding to select voter vs mixologist.
- Mixologist drink creation flow.
- Bracket winner propagation and display screen timing.
