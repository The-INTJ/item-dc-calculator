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
This master plan sequences the existing plans into a cohesive delivery path while reflecting the current mixology foundations already in place (routing, onboarding, voting, bracket view, admin dashboard, local contest state). It prioritizes role selection, contest state persistence, and backend wiring before deeper styling and bracket mechanics, so the contest can run end-to-end in a live event. The goal is to unlock parallel work once foundational flows (auth, guest sessions, routing, and lifecycle states) are stable across clients.

## Progress tracker
See [Mixology Rating App Progress](Mixology%20Rating%20App%20Progress.md) for the master progress checklist and current decisions.

## Needs exploration (research spikes)
- **Contest lifecycle persistence**: Contest lifecycle and round state are defined in `ContestStateContext` and contest types, but are currently stored in localStorage. Define how these states persist in Firestore and sync across devices. (Backend Plan + UX Plan.)
- **Participant decision + role policy**: Participant Decision page and role switching are not implemented yet. Define role storage, default-to-voter behavior, and the “role can change until contest starts” rule, plus how it surfaces on the account page. (UX Plan + Backend Plan.)
- **Display screen + timer behavior**: Confirm timer source, live score updates, and Score-phase recalculation rules to avoid double-counting and race conditions. (UX Plan + Backend Plan.)
- **Bracket progression & matchup outcomes**: `BracketView` renders rounds from contest data, but winner propagation and admin matchup tooling are not implemented. Decide on a bracket library or custom logic. (UX Plan.)
- **Guest identity persistence & privacy**: Guest identity is stored in cookies/localStorage and optionally registered in Firestore. Define server validation and retention policies. (Backend Plan.)
- **N/A scoring aggregation**: Validate scoring math, weights, and edge cases so UI, backend, and data model align. (Backend Plan + UX Plan.)
- **Theme boundaries & MUI Base usage**: Token and mixin layers exist under feature styles; decide how to reconcile shared primitives and semantic tokens between mixology and dc-calculator. (Style Plan.)

## Top items (linchpin do-dos)
1. **Persist contest lifecycle state and round data in the backend** so admin controls, voting gates, and bracket views stay consistent across clients. (Backend Plan + UX Plan)
2. **Implement Participant Decision + account role switching** with default-to-voter behavior and “role can change until contest starts” enforcement. (UX Plan + Backend Plan)
3. **Extend admin tooling for rounds/matchups and scoring controls** (winner propagation, score locking, display screen/timer). (UX Plan + Backend Plan)
4. **Finalize invite validation + Firestore provider wiring** so QR flows and guest sessions are backed by server validation. (Backend Plan)

## To-dos (pulled from plan steps)
- Wire the Firestore backend provider and Admin SDK into API routes for contest/round updates.
- Add Participant Decision page after onboarding and route it before voting.
- Store role selection (voter/mixologist/admin) and default to voter if no choice.
- Expose role switching on account page until contest starts.
- Add display screen + timer (Shake) and Score phase locking + recompute logic.
- Implement matchup winners + bracket advancement.
- Implement mixer scoring rules + N/A scoring aggregation.
- Formalize invite validation endpoint and contest lookup.
- Consolidate token strategy between mixology + dc-calculator themes.

## Ordered execution plan
1. **UX Plan (Participant Decision + account roles)**
   - Route onboarding to a Participant Decision page and implement the default-to-voter rule.
   - Add account-role switching UI with a guard that locks changes once contest is active.
2. **Backend Plan (Contest lifecycle persistence)**
   - Persist Debug/Set/Shake/Scored state and rounds in backend data.
   - Wire Firestore provider and Admin SDK for server-side admin updates.
3. **Admin tooling (State controls + rounds + matchups)**
   - Add winner propagation, score locking, and display screen/timer behavior.
4. **UX Plan (Bracket + standings)**
   - Expand bracket UI to show winners, active round, and standings.
5. **Style Plan (Token system + theme boundaries)**
   - Align token/semantic layers across mixology and dc-calculator; reduce duplicated token stacks.
6. **Scoring enhancements**
   - Add N/A scoring support and normalized aggregation.

## Parallelizable work
- **Style Plan** can proceed in parallel with backend wiring to avoid blocking UI improvements.
- **Bracket winner logic** can be prototyped alongside backend persistence, as long as the contest model remains stable.
- **Display screen prototype** can proceed once timer and score-lock expectations are defined.
- **Invite validation API** can be implemented independently of bracket work.
