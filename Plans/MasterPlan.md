# Master Plan

## Goal
Deliver a singleton Mixology Contest experience where guests join via QR, sign in as a guest or with Google, and land on a Participant Decision page to choose “vote” or “mixologist.” If they skip the choice, the app defaults them to voter; they can update their role on the account page until the contest begins. Admins control the contest lifecycle with Debug/Set/Shake/Score states, assign mixologists and matchups, and run a display screen that starts a timer during Shake, allows live scoring, then freezes and recomputes totals during Score before advancing.
## Contest Lifecycle States

The contest progresses through these states (controlled by admin):

| State | Purpose | Voting | UI Behavior |
|-------|---------|--------|-------------|
| **Debug** | Admin-only testing mode. Not used during live events. | Disabled | Extra logs enabled; debug UI visible only to admins. Entirely different data state for testing. |
| **Set** | Guests arriving and choosing roles. Happens once at competition start. | Disabled | Role selection open. Admin can return here if more guests need to join. |
| **Shake** | Drinks are being made, timer is running. | **OPEN** | Timer countdown visible. Voting interface active. Live score updates. |
| **Scored** | Voting closed, tallying scores. | **CLOSED** | Scores locked and displayed. Admin prepares next round. Triggers next Shake when ready. |

**Typical flow**: Set → Shake → Scored → Shake → Scored → ... (repeating Shake/Score for each round)
## Overview
This master plan sequences the existing plans into a cohesive delivery path while reflecting the current mixology foundations already in place (routing, onboarding, voting, bracket prototype, admin dashboard shell). It prioritizes role selection, contest state orchestration, and admin controls before deeper styling and bracket mechanics, so the contest can run end-to-end in a live event. The goal is to unlock parallel work once foundational flows (auth, guest sessions, routing, and lifecycle states) are stable.

## Progress tracker
See [Mixology Rating App Progress](Mixology%20Rating%20App%20Progress.md) for the master progress checklist and current decisions.

## Needs exploration (research spikes)
- **Contest lifecycle model**: The four states (Debug/Set/Shake/Score) are now defined. Debug is for admin testing only; Set is guest arrival; Shake is active mixing with voting OPEN; Score is voting CLOSED with tally. Map these to any existing `ContestPhase` types and round status so UI gates and admin controls stay consistent. (See Backend Plan + UX Plan.)
- **Participant decision + role policy**: Define role storage, default-to-voter behavior, and the “role can change until contest starts” rule, plus how it surfaces on the account page. (See UX Plan + Backend Plan.)
- **Display screen + timer behavior**: Confirm timer source, live score updates, and Score-phase recalculation rules to avoid double-counting and race conditions. (See UX Plan + Backend Plan.)
- **Bracket experience & data model**: Evaluate bracket libraries, how they map to our planned `Round`/`Matchup` model, and whether the admin workflow needs bespoke UI components or can lean on an existing library. (See UX Plan.)
- **Guest identity persistence & privacy**: Confirm cookie retention, device fingerprinting strategy, and any compliance constraints before we store guest IDs and invite context at scale. (See Backend Plan.)
- **N/A scoring aggregation**: Validate scoring math, weights, and edge cases so UI, backend, and data model align. (See Backend Plan + UX Plan.)
- **Theme boundaries & MUI Base usage**: Decide how much styling can be expressed via tokens vs. component-level overrides, and whether legacy and mixology surfaces need additional isolation beyond semantic tokens. (See Style Plan.)

## Top items (linchpin do-dos)
1. **Define contest lifecycle states (Debug/Set/Shake/Score) and map them to `ContestPhase` + round status** so admin controls, voting gates, and display screen behavior are consistent. (Backend Plan + UX Plan)
2. **Implement Participant Decision + account role switching** with default-to-voter behavior and “role can change until contest starts” enforcement. (UX Plan + Backend Plan)
3. **Admin control surface for rounds/matchups and state transitions** including display screen timing, score locking, and Score-phase recalculation. (UX Plan + Backend Plan)
4. **Finalize invite URL + guest session rules** to unblock QR onboarding and persistence. (Backend Plan)

## To-dos (pulled from plan steps)
- Confirm invite URL/query format and guest session retention strategy. (Backend Plan)
- Add Participant Decision page after onboarding and route it before voting. (UX Plan)
- Store role selection (voter/mixologist/admin) and default to voter if no choice. (Backend Plan + UX Plan)
- Expose role switching on account page until contest starts. (UX Plan)
- Define contest lifecycle state machine and map to existing `ContestPhase` and round status. (Backend Plan + UX Plan)
- Add admin controls for contest state transitions, round/matchup setup, and mixer assignment. (UX Plan + Backend Plan)
- Implement Shake display screen: timer start, live scoring view, and scoreboard updates. (UX Plan + Backend Plan)
- Implement Score phase: lock submissions, recompute totals, show winner + next round preview. (UX Plan + Backend Plan)
- Define Admin SDK entry points and access strategy for privileged actions. (Backend Plan)
- Implement the Firestore backend provider (client or server) behind the existing provider abstraction. (Backend Plan)
- Implement mixer scoring logic and UI enforcement. (Backend Plan + UX Plan)
- Establish the mixology landing experience (guest vs. authenticated widgets) and minimal navbar. (UX Plan)
- Build core mixology routes for voting, drink creation, bracket view, and admin shells. (UX Plan)
- Stand up the Sass token system, semantic layers, and theme mapping to MUI. (Style Plan)
- Incrementally migrate legacy + mixology styles into module-based Sass with container queries. (Style Plan)

## Ordered execution plan
1. **UX Plan (Participant Decision + account roles)**
   - Route onboarding to a Participant Decision page and implement the default-to-voter rule.
   - Add account-role switching UI with a guard that locks changes once contest is active.
2. **Backend Plan (Contest lifecycle + identity)**
   - Define the Debug/Set/Shake/Score state machine and map to `ContestPhase` and round status.
   - Implement guest creation/invite flows and core Firestore-backed provider to persist sessions and scores.
3. **Admin tooling (State controls + rounds)**
   - Add admin controls for state transitions, round/matchup setup, and mixer assignment.
   - Build display screen/timer and Score-phase recalculation with score lockouts.
4. **UX Plan (Bracket + standings)**
   - After lifecycle controls are stable, wire bracket UI to real round data and standings.
5. **Style Plan (Token system + theme boundaries)**
   - Introduce token architecture and theme split to provide consistent styling for the new mixology surfaces.
   - Migration can proceed in parallel with feature work once tokens exist.

## Parallelizable work
- **Style Plan** can begin once the Participant Decision + role flow is sketched (step 1), since tokens and theme scaffolding can be built independently of backend wiring.
- **Backend Plan admin SDK routes** can proceed alongside UX role work, provided the contest lifecycle mapping is agreed upon.
- **Display screen prototype** can run in parallel with admin state controls once timer + score-lock expectations are defined.
- **Bracket research spike** can run at any time; it should feed into step 4.
