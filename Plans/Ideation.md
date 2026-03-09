## Goal

Add a “TV display mode” for any contest, reachable at a dedicated URL, that renders a live-updating, left-to-right bracket view with:

* The current/active round emphasized
* Winners and vote totals per round/matchup
* A themed, big-screen-friendly presentation

The display view should be mostly “read-only” and reactive, driven by the same underlying contest + scoring data as the rest of the app.

---

## High-level structure

### 1) Route / entry point

* Each contest already has a canonical URL (`/contest/:id`).
* Add a second URL for display mode (`/contest/:id/display`).
* From the standard contest page, provide a single “Display Mode” link/button that navigates to the display URL.

### 2) Display page composition

The display page is a thin shell that renders one top-level “ContestDisplay” feature component. That feature component is responsible for:

* Loading/subscribing to contest structure (entries, rounds, bracket shape)
* Loading/subscribing to scoring/vote totals
* Deriving a single “display model” that the UI can render

All visual pieces under it are presentational: they just take the model and render.

### 3) Data flow: source → derived model → UI

Think in three layers:

**A. Sources (raw app state)**

* Contest metadata and structure (entries, rounds, bracket definition, statuses)
* Vote totals / scoring data (per entry, per matchup, per category if needed)

**B. Derived “Display Model”**
A single consolidated object that contains:

* The bracket graph (round columns, matchups, participant IDs)
* The current “active round” identifier
* Computed totals per entry/matchup
* Winners per matchup/round (based on stored winner or computed totals)
* Optional summary sections (round recap, “now playing”, “up next”)

**C. UI**

* Bracket view (columns left→right)
* Highlighting for active round/matchups
* Side panels / overlays for winners and totals
* Thematic styling appropriate for TV

The important constraint: the UI should never need to query Firestore directly or do ad-hoc computation; it consumes the display model.

---

## Bracket representation (conceptual)

To render a bracket reliably, you need an explicit bracket shape:

* Rounds in order (left→right)
* Each round contains matchups
* Each matchup references its participants (entry IDs) and optionally its winner

You can store this bracket shape with the contest so display mode doesn’t have to infer structure from scoring.

---

## “Active round” concept

Display mode needs a deterministic way to know what to emphasize:

* Prefer an explicit `activeRoundId` (best operator experience, simplest logic).
* Otherwise infer “active” as the first incomplete round or the most recent in-progress round.

The active round drives:

* Which column pulses/highlights
* Which matchup totals are “live”
* Which side panel is “current”

---

## Live updates (conceptual)

TV mode should react automatically as judging happens:

* Subscribe to contest structure changes (round transitions, winner assignment, advancing entries).
* Subscribe to scoring updates (vote totals changing).
* Rebuild the derived display model whenever either stream changes.

Result: the TV page stays current without refreshes.

---

## Separation of responsibilities

* **Display page**: route wiring only
* **Display feature component**: coordinates data sources, derives display model
* **Bracket components**: render-only
* **Styling/theme layer**: centralized tokens/classes for “TV mode” look

This keeps the bracket UI easy to iterate on without touching data logic.

---

## Operator interaction (optional)

Keep TV mode read-only by default, but optionally support minimal controls (behind a flag/query param) such as:

* Manually set active round
* Toggle “totals on/off”
* Toggle “winners only” vs “full details”

These controls should be treated as admin actions, not core display logic.

---

## Implementation path (high-level)

1. Add the display URL and navigation to it from the contest page
2. Build a static bracket UI using mocked data
3. Connect contest structure as a live source
4. Connect vote totals as a live source
5. Introduce the derived display model and wire the UI to it
6. Add active round emphasis + winner/totals overlays
7. Add theming polish for TV readability and presence
