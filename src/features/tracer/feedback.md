# Tracer — playtest feedback

Drew's notes from playtesting, plus what was done about each. To add a note,
drop a dated line under **Inbox** (what you did, what you expected); it gets
triaged into **Open** with a cause and a plan, then moves to **Done**.

## Inbox

_(empty)_

## Open

### 3. A stale sign-in breaks online play until you sign in fresh — 2026-10-03

Split out of item 1. Online games still need a sign-in, and a browser whose
saved session the server rejects (see item 1's cause) gets "Your session
expired. Reload the page…" — but reloading does not help.

**Plan.** On a 401, force a token refresh; if the server still rejects it,
sign the stale session out, start a fresh guest under the typed name, and
retry once. Replace the "Reload the page" copy. Until then: a private window,
or sign out at `/account`.

## Done

### 2. The ever-growing king library made the game untactical — 2026-10-03

**What Drew saw.** The king accumulated every pattern ever charted, of any
length, so play became "tap my king and see what it threatens". Tactics only
came from deliberately limiting how many squares a Tracer covered; long weird
paths stumbled into threats on three pieces at once that no one could have
planned.

**Done (v2, local only — not merged or deployed).**
- The king now borrows only its Tracers' **current** patterns — at most three,
  one per Tracer. A captured Tracer's last pattern stays with its king
  (Drew's call).
- Tracers are tiered by step limit: **3, 5 and 8** squares per chart (up to N).
- New layout, like chess: 8-step Tracer on d (its own colour), king on e,
  Wardens on b, d, e, g; 3-step on b, 5-step on g; mirrored for Black.
- Tracer pieces show their number; the Kings tab shows each king's three
  borrowed patterns (current, kept after capture, or not charted yet).

### 1. "Play both sides" locally failed with "Your session expired" — 2026-10-03

**What happened.** On `npm run dev`, *Play both sides* → *Start game* → "Your
session expired". Cause: a stale saved sign-in — the persisted emulator users
carry `validSince = 2026-09-17`, and the server's revocation check compares
that to the token's original sign-in time, which refreshes never change.

**Expected (Drew).** Local play should work without sign-in and make no
server calls at all.

**Done (v2, local only).** *Play both sides on this device* now starts a
local game at `/tracer/local/<id>`: no sign-in, no API, no Firestore — the
engine runs in the browser and the game is saved in localStorage. The local
page doesn't even mount the sign-in provider, and an E2E spec asserts it makes
zero server calls (signed out and signed in). Local games add *Undo last
move*, *Call it a draw*, *New local game*, and show up under recent games.
Server-side "hotseat" games were retired.
