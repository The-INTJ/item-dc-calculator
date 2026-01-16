# Master Plan

## Overview
This master plan sequences the existing plans into a cohesive delivery path while highlighting areas that require further research. It prioritizes core user access, basic data flow, and navigation before deeper styling, admin tooling, and bracket mechanics. The goal is to unlock parallel work once foundational flows (auth, guest sessions, routing) are stable.

## Progress tracker
See [Mixology Rating App Progress](Mixology%20Rating%20App%20Progress.md) for the master progress checklist and current decisions.

## Needs exploration (research spikes)
- **Bracket experience & data model**: Evaluate bracket libraries, how they map to our planned `Round`/`Matchup` model, and whether the admin workflow needs bespoke UI components or can lean on an existing library. (See UX Plan.)
- **Guest identity persistence & privacy**: Confirm cookie retention, device fingerprinting strategy, and any compliance constraints before we store guest IDs and invite context at scale. (See Backend Plan.)
- **N/A scoring aggregation**: Validate scoring math, weights, and edge cases so UI, backend, and data model align. (See Backend Plan + UX Plan.)
- **Theme boundaries & MUI Base usage**: Decide how much styling can be expressed via tokens vs. component-level overrides, and whether legacy and mixology surfaces need additional isolation beyond semantic tokens. (See Style Plan.)

## Top items (linchpin do-dos)
1. **Finalize invite URL + guest session rules** to unblock onboarding flows and backend persistence. (Backend Plan)
2. **Define core mixology routes + landing UX** so frontend work has stable entry points. (UX Plan)
3. **Agree on data model for contests/rounds/scores** to keep backend and UI aligned. (Backend Plan + UX Plan)

## To-dos (pulled from plan steps)
- Confirm invite URL/query format and guest session retention strategy. (Backend Plan)
- Define Admin SDK entry points and access strategy for privileged actions. (Backend Plan)
- Implement the Firestore backend provider (client or server) behind the existing provider abstraction. (Backend Plan)
- Implement mixer scoring logic and UI enforcement. (Backend Plan + UX Plan)
- Establish the mixology landing experience (guest vs. authenticated widgets) and minimal navbar. (UX Plan)
- Build core mixology routes for voting, drink creation, bracket view, and admin shells. (UX Plan)
- Stand up the Sass token system, semantic layers, and theme mapping to MUI. (Style Plan)
- Incrementally migrate legacy + mixology styles into module-based Sass with container queries. (Style Plan)

## Ordered execution plan
1. **UX Plan (Foundation)**
   - Establish routing, landing widgets, and minimal navbar so users can enter the app and see role-based options.
   - This unblocks parallel work in backend sessions and styling because the UI surface is defined.
2. **Backend Plan (Core identity + data)**
   - Implement guest creation/invite flows and core Firestore-backed provider to persist sessions and scores.
   - Define admin roles and basic contest/drink models to support UI data.
3. **Style Plan (Token system + theme boundaries)**
   - Introduce token architecture and theme split to provide consistent styling for the new mixology surfaces.
   - Migration can proceed in parallel with feature work once tokens exist.
4. **UX Plan (Bracket + admin tooling)**
   - After core data flows are stable, implement bracket UI and admin round controls.
   - This step depends on the bracket research spike and data model alignment.

## Parallelizable work
- **Style Plan** can begin once core mixology routes are in place (step 1), since tokens and theme scaffolding can be built independently of backend wiring.
- **Backend Plan admin SDK routes** can proceed alongside UX landing work, provided the data model is agreed upon.
- **Bracket research spike** can run at any time; it should feed into step 4.
