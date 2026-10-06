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

### 7. A v3: one-direction routes, Tracer steps, a declaring king — 2026-10-04

**What Drew asked.** Fill the Warden line; Tracers trace a route without
having to move along it, and the route works only in the exact direction
traced; Tracers may step one square (no capture) any time; the king may pick
any Tracer's route but must declare it a turn ahead, in view of the
opponent. Clarified by Drew: after tracing, *pick where along the route to
be*; the route is then active every later turn, only in that direction, out
from where the Tracer landed. Executing works like riders/jumpers do now;
declaring is the king's turn; the new Wardens are c2 and f2.

**Done** as the style *Routes (v3)* — now the default — built from four new
rules (each a toggle): pattern directions (all / as traced), where a chart
stops (end / anywhere or stay), Tracers can step, and the king's borrowed
moves (any time / declared). *Tiered* and *Original* play exactly as before.

### 6. Invite links didn't work for friends — 2026-10-04

**What happened.** Links were built from the address the sender was on.
Opened from the Vercel app, that is the deployment's own URL
(`…-theintjs-projects.vercel.app`), which Vercel puts behind its login — so
friends hit a Vercel sign-in page. The public domain worked end to end (a
two-browser probe on production: guest creates, guest joins by link, both
move).

**Done (PR #69).** Production builds always link to the public production
domain (`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`); previews and local dev
link to wherever they run.

### 5. Dodges, threat lines, protection, and the last-move highlight — 2026-10-04

**What Drew asked.**
- Dodges should require having been threatened; an unthreatened free step
  shouldn't extend the tally. The dodge number should be a toggle, and drop
  to 3 from 6.
- Threat squares need lines from the attacking pieces, or show on hover
  which pieces target a square.
- Protected pieces weren't shown as threatened squares, or marked at all.
- A just-moved piece's old square showed yellow, which seemed to override
  Show threats.

**Done.**
- New rule **Dodges need a threat** (toggle): a free step counts only if the
  king was threatened as the turn began; any other turn resets the count.
  *Tiered (v2)* now draws on **3** such dodges; *Original (v1)* keeps its six
  any-step dodges so live v1 games play on unchanged. Older v2 local games
  keep the rules they were played under (shown as "2 tweaks").
- Show threats now draws red lines from attackers into each of your
  threatened pieces, and into any square you hover, focus or tap; the
  opponent's defended pieces are included in the red squares, and your
  defended pieces get a small shield. A one-line legend explains it.
- The threat hatch now has its own red edge and sits over the yellow
  last-move tint, so both stay visible.

### 4. Rule variants as a first-class system — 2026-10-04

**What Drew asked.** Keep v1 and v2 as code-defined profiles picked from a
dropdown before a game (no sign-in needed, friends can send variants), with
rule toggles adjustable before the game — bespoke where it helps, like a step
limit per Tracer tier. No mid-game rule changes, but nothing that would rule
them out: charting kept apart from step limits.

**Done** (shipped 2026-10-04 with item 5).
- Every game stores its own rules; the engine reads them only through
  `engine/rulebook.ts`. *Tiered (v2)* (default) and *Original (v1)* are
  styles; six toggles cover layout, step limits, the king's patterns, the
  free step, lone king and the dodge draw.
- Lobby: style picker, **Customize rules** (changed rules marked, each with a
  reset), **Share setup link**, and How to play written for the chosen rules.
  In game: a **Rules:** chip ("Original (v1) · 1 tweak") opening a rules list
  with "changed" badges; rematch and **New game, same rules** keep them.
- Saved v1 games (production) and v2 games (local) upgrade on read and keep
  playing; eight games from production's engine replay identically.

### 2. The ever-growing king library made the game untactical — 2026-10-03

**What Drew saw.** The king accumulated every pattern ever charted, of any
length, so play became "tap my king and see what it threatens". Tactics only
came from deliberately limiting how many squares a Tracer covered; long weird
paths stumbled into threats on three pieces at once that no one could have
planned.

**Done (v2, shipped 2026-10-04).**
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

**Done (v2, shipped 2026-10-04).** *Play both sides on this device* now starts a
local game at `/tracer/local/<id>`: no sign-in, no API, no Firestore — the
engine runs in the browser and the game is saved in localStorage. The local
page doesn't even mount the sign-in provider, and an E2E spec asserts it makes
zero server calls (signed out and signed in). Local games add *Undo last
move*, *Call it a draw*, *New local game*, and show up under recent games.
Server-side "hotseat" games were retired.
