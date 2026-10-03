# Tracer

An online two-player board game: **pieces learn their moves from the paths
you draw, and your king learns every pattern your side has ever drawn.**
Lobby at `/tracer`, games at `/tracer/[gameId]`. Send the link, play a friend.

The rules below were designed with Drew on 2026-10-03. Treat them as the spec:
change them deliberately, not incidentally.

## Rules (v1)

### Board and setup
8×8, White moves first. Black mirrors White, so the kings face each other on
the d-file, each on its own colour (d1 light, d8 dark).

```
    a b c d e f g h
 8  . T . K . T . T     Black
 7  . W . W . W . W
 2  . W . W . W . W     White
 1  . T . K . T . T
```

T = Tracer ×3, W = Warden ×4, K = King. The layout is one constant
(`engine/setup.ts`), spaced so the king can always step away from a jumper.

### Pieces
| Piece | Moves | Captures? |
|---|---|---|
| Warden | One step, any direction | Always |
| Tracer | **Strike** with its current pattern, or **Chart** a new one | Strike yes, chart never |
| King | One step, or any pattern in its side's **library** | Yes |

Tracers start **unformed**, so their first move is a chart.

### Charting
- Tap a chain of squares, each orthogonally or diagonally next to the last.
  No square twice, never back to the start; the last square must be empty.
- Squares before the last may hold anything, either side's pieces and kings
  included. If **any** of them is occupied, the pattern is a **Jumper**;
  otherwise it is a **Rider**. Squeezing diagonally between two pieces is not
  passing through them.
- No length limit beyond the board (≤ 63 steps). A one-step chart is a rider,
  and a jump whose net offset is one square behaves as — and is stored as —
  the one-step rider in that direction.
- The new pattern replaces the Tracer's old one and joins its king's library
  immediately and permanently (even after the Tracer is captured).

### Using a pattern
Every pattern works in all 8 orientations (4 rotations × mirror).
- **Rider:** walk the oriented path; stop on any square along it. The walk
  ends at the board edge or the first piece, which may be captured if it is
  an enemy. Riders never pass through pieces.
- **Jumper:** land exactly on the oriented net offset, ignoring everything in
  between; capture only on the landing square.

### King library
The set of patterns the side has charted, deduplicated up to symmetry
(riders by step sequence, jumpers by offset). The king uses them with the
same rider/jumper rules. Kings never chart.

### A turn is exactly one of
- **Piece turn:** one Tracer move (strike or chart) or one Warden move, plus
  an optional **free king step** — one square to an empty neighbour, no
  capture — before or after the piece move.
- **King turn:** the king steps one square (capture or not) or moves by a
  library pattern. That is the whole turn: no free step, no piece move.

A turn is composed on screen and submitted atomically; the server re-checks
everything.

### Ending
- **Capture the king** — immediate win.
- **Lone king** — a capture that leaves the opponent only its king wins.
- **Dodge-streak draw** — six of one player's own turns in a row with the
  free step, and no capture by either side meanwhile, draws on the sixth. A
  turn without the free step resets that player's count; any capture resets
  both.
- Resign any time; draws by agreement (an offer stands until answered, or
  until the recipient moves instead).
- No check rules: moving into danger is legal; the UI warns first.

### Open questions (defaults in place)
1. Shuffles outside the dodge streak can loop forever; v1 relies on resign /
   agreed draws. Add a ply cap if playtests show stalling.
2. Warden-plus-step turns count toward the streak, and any capture resets
   both counts.
3. A stalled seat can be reopened by the opponent after 15 minutes
   (`SEAT_RELEASE_AFTER_MS`).
4. Layout: moving the d2 Warden would give the king a fifth escape square.

Later, not v1: board fixtures/objectives, hex grid, library-on-capture,
chart distance limits, clocks, warden upgrades, push notifications.

## How it is built

```
engine/       Pure rules. No React, no Firebase. Browser previews + server authority.
lib/          storage (zod + doc codec) · policy (viewer, seats, draws) · server
              (pure commands, transaction repository, service) · api (browser
              client) · realtime (live listeners) · presentation (copy)
hooks/        live game, identity, commands, and composer/ (turn being built)
components/   lobby · game · board · composer · panels · shared
```

- **Writes** go through `POST /api/tracer/games/...` (`app/api/tracer/`).
  Each route verifies the caller (`requireAuth`), then runs a pure command in
  a Firestore transaction (`lib/server/gameRepository.ts`). Commands throw a
  typed `TracerError`; `app/api/tracer/_lib/respond.ts` maps codes to status.
- **Reads** are live `onSnapshot` listeners on `tracerGames/{id}` and its
  `turns` subcollection. Rules allow anyone holding the (unguessable) id to
  read; nobody can list games; browsers never write.
- **Identity** reuses the contest `AuthProvider`: a friend opening a link
  types a name and becomes an anonymous guest. Seats store `{ uid, name }`.
- **Turn submission** carries `clientTurnId` (a retry after a dropped
  connection is acknowledged, not re-applied) and the ply it was built
  against (`STALE_PLY` otherwise).
- **Hotseat** ("Play both sides on this device") seats one person on both
  sides; the board turns to face the side to move. Handy for playtesting.

### Data model
`tracerGames/{gameId}` holds the whole engine `GameState` plus seats, status
(`open` → `active` → `finished`), the last turn, any draw offer and rematch
links; `turns/{0000…}` holds one immutable `TurnRecord` per turn. Paths are
numpad-digit strings (8 = north) and squares are `"d4"`, so nothing nests
arrays (Firestore can't). Timestamps are server `Date.now()` numbers.

### API errors
| Code | Status | Meaning |
|---|---|---|
| `GAME_NOT_FOUND` | 404 | No such game (or a malformed id) |
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
- **Deploying:** the `tracerGames` rules ship with `npm run deploy:rules`
  (production Firebase) and must be deployed before the app code that reads
  them; merging to `main` deploys the app to production. Both need explicit
  approval.
