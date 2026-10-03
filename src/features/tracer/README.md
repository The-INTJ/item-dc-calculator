# Tracer

An online two-player board game: **pieces learn their moves from the paths
you draw, and your king borrows each of its Tracers' current patterns.**
Lobby at `/tracer`, online games at `/tracer/[gameId]` (send the link, play a
friend), local games at `/tracer/local/[localId]` (both sides on one device).

Designed with Drew on 2026-10-03. Treat these rules as the spec: change them
deliberately, not incidentally. Playtest notes live in [feedback.md](feedback.md).

## Rules (v2)

v1 let the king collect every pattern ever charted; after playtesting that
turned the game into "tap the king and see what it threatens", so v2 limits
the king to its Tracers' current patterns and gives each Tracer a step limit.

### Board and setup
8×8, White moves first. Black mirrors White, the way chess does.

```
    a b c d e f g h
 8  . 3 . 8 K . 5 .     Black
 7  . W . W W . W .
 2  . W . W W . W .     White
 1  . 3 . 8 K . 5 .
```

3 / 5 / 8 = Tracers with that step limit, W = Warden, K = King. The 8-step
Tracer starts on its own colour (d1 light, d8 dark) beside the king, with two
Wardens in front of them; the other Tracers sit on b and g behind a Warden
each. The layout is one constant (`engine/setup.ts`).

### Pieces
| Piece | Moves | Captures? |
|---|---|---|
| Warden ×4 | One step, any direction | Always |
| Tracer ×3 (3-, 5-, 8-step) | **Strike** with its current pattern, or **Chart** a new one of up to its step limit | Strike yes, chart never |
| King | One step, or any pattern its Tracers lend it | Yes |

Tracers start **unformed** (drawn dashed), so their first move is a chart.

### Charting
- Tap a chain of squares, each orthogonally or diagonally next to the last,
  **at most the Tracer's step limit** (3, 5 or 8). No square twice, never back
  to the start; the last square must be empty.
- Squares before the last may hold anything, either side's pieces and kings
  included. If **any** of them is occupied, the pattern is a **Jumper**;
  otherwise it is a **Rider**. Squeezing diagonally between two pieces is not
  passing through them.
- A one-step chart is a rider, and a jump whose net offset is one square
  behaves as — and is stored as — the one-step rider in that direction.
- The new pattern replaces the Tracer's old one — for the Tracer and for its
  king.

### Using a pattern
Every pattern works in all 8 orientations (4 rotations × mirror).
- **Rider:** walk the oriented path; stop on any square along it. The walk
  ends at the board edge or the first piece, which may be captured if it is
  an enemy. Riders never pass through pieces.
- **Jumper:** land exactly on the oriented net offset, ignoring everything in
  between; capture only on the landing square.

### The king
- Besides its one-square step, the king may move by any pattern its Tracers
  lend it — **one per Tracer**, so at most three: whatever each Tracer charted
  last.
- When a Tracer is captured, the king **keeps** that Tracer's last pattern
  for the rest of the game.
- The king uses borrowed patterns with the same rider/jumper rules. Kings
  never chart.

### A turn is exactly one of
- **Piece turn:** one Tracer move (strike or chart) or one Warden move, plus
  an optional **free king step** — one square to an empty neighbour, no
  capture — before or after the piece move.
- **King turn:** the king steps one square (capture or not) or moves by a
  borrowed pattern. That is the whole turn: no free step, no piece move.

A turn is composed on screen and submitted atomically; online, the server
re-checks everything.

### Ending
- **Capture the king** — immediate win.
- **Lone king** — a capture that leaves the opponent only its king wins.
- **Dodge-streak draw** — six of one player's own turns in a row with the
  free step, and no capture by either side meanwhile, draws on the sixth. A
  turn without the free step resets that player's count; any capture resets
  both.
- Resign any time; draws by agreement (online, an offer stands until
  answered, or until the recipient moves instead).
- No check rules: moving into danger is legal; the UI warns first.

### Open questions (defaults in place)
1. Shuffles outside the dodge streak can loop forever; resign / agreed draws
   cover it. Add a ply cap if playtests show stalling.
2. Warden-plus-step turns count toward the streak; any capture resets both.
3. A stalled online seat can be reopened by the opponent after 15 minutes
   (`SEAT_RELEASE_AFTER_MS`).

Later, not v2: board fixtures/objectives, hex grid, chart distance limits by
other means, clocks, warden upgrades, push notifications.

## How it is built

```
engine/       Pure rules. No React, no Firebase. Runs in the browser and on the server.
lib/          storage (zod + doc codec) · policy (viewer, seats, draws) · server
              (pure commands, transaction repository, service) · api (browser
              client) · realtime (live listeners) · local (on-device games) ·
              presentation (copy)
hooks/        live game, identity, commands, local games, and composer/ (turn being built)
components/   lobby · game (online) · local · board · composer · panels · shared
```

### Online games
- **Writes** go through `POST /api/tracer/games/...` (`app/api/tracer/`).
  Each route verifies the caller (`requireAuth`), then runs a pure command in
  a Firestore transaction (`lib/server/gameRepository.ts`). Commands throw a
  typed `TracerError`; `app/api/tracer/_lib/respond.ts` maps codes to status.
- **Reads** are live `onSnapshot` listeners on `tracerGames/{id}` and its
  `turns` subcollection. Rules allow anyone holding the (unguessable) id to
  read; nobody can list games; browsers never write.
- **Identity** reuses the contest `AuthProvider` (mounted by the lobby and
  online game pages only, via `TracerAuth`): a friend opening a link types a
  name and becomes an anonymous guest. Seats store `{ uid, name }`.
- **Turn submission** carries `clientTurnId` (a retry after a dropped
  connection is acknowledged, not re-applied) and the ply it was built
  against (`STALE_PLY` otherwise).
- Games saved by v1 (`schemaVersion: 1`) read as `GAME_OUTDATED` and the page
  explains they cannot be continued.

### Local games ("Play both sides on this device")
- No sign-in, no API, no Firestore: the engine runs in the browser and the
  game (state + turn records) is saved under `tracer:local:<id>` in
  localStorage (`lib/local/`). The page is outside `TracerAuth`, so it makes
  no auth calls either — `e2e/specs/tracer-local.spec.ts` asserts that.
- Undo replays the turn records minus the last one (or reopens a game ended
  by resignation or agreement).
- The shared board takes a `TurnSender`, so online and local games use the
  same composer, board and panels.

### Data model
`tracerGames/{gameId}` holds the whole engine `GameState` (pieces with their
step limits, each king's borrowed patterns keyed by Tracer id, dodge counts,
result) plus seats, status (`open` → `active` → `finished`), the last turn,
any draw offer and rematch links; `turns/{0000…}` holds one immutable
`TurnRecord` per turn. Paths are numpad-digit strings (8 = north) and squares
are `"d4"`, so nothing nests arrays (Firestore can't). Timestamps are server
`Date.now()` numbers.

### API errors
| Code | Status | Meaning |
|---|---|---|
| `GAME_NOT_FOUND` | 404 | No such game (or a malformed id) |
| `GAME_OUTDATED` | 410 | Saved under the v1 rules |
| `NOT_A_PLAYER` | 403 | Caller holds no seat |
| `GAME_FULL` · `GAME_NOT_ACTIVE` · `NOT_YOUR_TURN` · `STALE_PLY` | 409 | State conflicts |
| `DRAW_OFFER_PENDING` · `NO_DRAW_OFFER` · `SEAT_NOT_RELEASABLE` · `GAME_NOT_FINISHED` | 409 | Command not valid now |
| `ILLEGAL_TURN` | 422 | Engine rejected the turn; `reason` holds the engine code |
| `CORRUPT_GAME` / `STORAGE_UNAVAILABLE` | 500 / 503 | Server-side problems |

## Working on this feature
- Engine changes: add a scenario test (ASCII boards via
  `engine/fixtures/position.ts`) and keep `engine/playout.test.ts` green — it
  self-plays seeded random games checking invariants and replay determinism.
- `npm test`, `npm run lint`, `npm run type-check`, and the Tracer E2E specs
  (`npx playwright test tracer mobile-tracer`) cover it end to end.
- **Deploying:** rules ship with `npm run deploy:rules` (production Firebase)
  before app code that depends on them; merging to `main` deploys the app to
  production. Both need explicit approval. v1 is live; **v2 is local-only
  until Drew says otherwise.**
