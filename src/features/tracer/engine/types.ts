/**
 * Tracer engine types.
 *
 * Everything here is plain, JSON-safe data so the same values can be stored in
 * Firestore, sent over the API, and handed to React without conversion:
 * squares are algebraic strings, paths are numpad-digit strings, missing
 * values are `null`, and no array ever sits directly inside another array
 * (Firestore cannot store nested arrays).
 */

export type Side = 'w' | 'b';

export type PieceKind = 'king' | 'tracer' | 'warden';

/** Algebraic square name, `a1`..`h8`. Rank 1 is White's back rank. */
export type SquareName = string;

/**
 * A path as numpad direction digits: 8=N 9=NE 6=E 3=SE 2=S 1=SW 4=W 7=NW,
 * where N points toward rank 8. Every digit is one king step, so adjacency is
 * built into the format. At most 63 digits.
 */
export type StepString = string;

/**
 * A movement pattern. `R:<steps>` is a rider (walks the path, may stop on any
 * square, blocked by pieces); `J:<dx>,<dy>` is a jumper (lands exactly on the
 * net offset, ignores what lies between). A tracer stores its pattern in the
 * orientation it was charted, and its king borrows the same code.
 */
export type PatternCode = string;

export interface Piece {
  /** Stable id from the layout, prefixed by side: `wK`, `wT1`, `bW3`… */
  id: string;
  side: Side;
  kind: PieceKind;
  at: SquareName;
  /**
   * Tracers: the current pattern, or null while unformed. Kings, when the
   * rules make them declare borrowed routes: the declared one (else null).
   */
  pattern: PatternCode | null;
  /** Tracers only: which tier this Tracer is (its step limit comes from the rules). */
  tier: number | null;
}

// ─── Rules ────────────────────────────────────────────────────────────────
// A RuleSet is plain data stored with every game and frozen for that game.
// The engine reads it only through engine/rulebook.ts (and setup.ts places
// the layout); the variants/ layer defines the named rule sets.

/** Where the king's extra patterns come from (besides its one-square step). */
export type KingMemory = 'none' | 'current' | 'current-kept' | 'every-chart';

/** Which main moves may take the free king step along. */
export type FreeStepRule = 'off' | 'with-tracer' | 'with-tracer-or-warden';

/** Patterns work in all eight orientations, or only exactly as traced. */
export type PatternOrientations = 'all' | 'as-traced';

/** Where a charting Tracer ends up: its path's end, or any square along it (or where it started). */
export type ChartLanding = 'end' | 'any';

/** The king moves by borrowed patterns any time, or only by one it declared on an earlier turn. */
export type KingBorrow = 'any-time' | 'declared';

/** One of White's starting pieces; Black's mirror it across the board. */
export interface Placement {
  /** Piece id without the side prefix, e.g. `K`, `T1`, `W3`. */
  id: string;
  kind: PieceKind;
  file: string;
  /** 0 = back rank, 1 = the rank in front of it. */
  row: 0 | 1;
  /** Tracers only. */
  tier: number | null;
}

export interface Layout {
  id: string;
  name: string;
  pieces: Placement[];
}

export interface RuleSet {
  layout: Layout;
  /** Step limits by Tracer tier; a missing or null tier has no limit. */
  tracerReach: { limited: boolean; limits: (number | null)[] };
  kingMemory: KingMemory;
  freeStep: FreeStepRule;
  /** A capture that leaves only the enemy king wins. */
  loneKingWins: boolean;
  /** Dodges in a row (with no capture) that draw the game; 0 = never. */
  dodgeDraw: number;
  /** A free king step counts as a dodge only if the king was threatened as the turn began. */
  dodgeNeedsThreat: boolean;
  patternOrientations: PatternOrientations;
  chartLanding: ChartLanding;
  /** Tracers may step one square in any direction, never capturing. */
  tracerStep: boolean;
  kingBorrow: KingBorrow;
}

export type WinReason = 'king-capture' | 'lone-king' | 'resignation';
export type DrawReason = 'step-streak' | 'agreement';

export type GameResult =
  | { status: 'active' }
  | { status: 'won'; winner: Side; reason: WinReason; atPly: number }
  | { status: 'drawn'; reason: DrawReason; atPly: number };

/**
 * A position. Besides where the pieces are, it records facts that any rule
 * set might need — each Tracer's last pattern, every pattern ever charted —
 * whether or not the current rules use them.
 */
export interface GameState {
  rules: RuleSet;
  /** Turns played so far. White moves on even plies, Black on odd. */
  ply: number;
  pieces: Piece[];
  /** Each Tracer's latest pattern, by Tracer id — kept after it is captured. */
  lastCharted: Record<Side, Record<string, PatternCode>>;
  /** Canonical keys of every pattern each side has charted, first-charted first. */
  chartedKeys: Record<Side, PatternCode[]>;
  /** The same, exactly as charted (orientation kept), first-charted first. */
  chartedCodes: Record<Side, PatternCode[]>;
  /** Consecutive own turns that were dodges (see rulebook `isDodge`), with no capture meanwhile. */
  stepStreak: Record<Side, number>;
  result: GameResult;
}

/**
 * The one main action of a turn. `move` covers a warden step, a tracer
 * strike or step, and a king move (base step or a borrowed pattern): the
 * piece standing on `from` decides which. A chart's `land` is how many of its
 * steps the Tracer walks before stopping (0 = stays put); left out, it walks
 * them all. `declare` has the king pick a borrowed pattern to move by on later
 * turns, where the rules ask for that. `pass` is only legal with no legal move.
 */
export type MainAction =
  | { kind: 'move'; from: SquareName; to: SquareName }
  | { kind: 'chart'; from: SquareName; steps: StepString; land?: number }
  | { kind: 'declare'; pattern: PatternCode }
  | { kind: 'pass' };

/** The optional free king step: one square, to an empty square, no capture. */
export interface FreeStep {
  to: SquareName;
  when: 'before' | 'after';
}

export interface TurnInput {
  /** The ply this turn was built against; guards against stale submissions. */
  ply: number;
  main: MainAction;
  /** Only allowed with a tracer or warden move — never with a king move. */
  freeStep: FreeStep | null;
}

export interface CapturedPiece {
  id: string;
  kind: PieceKind;
}

/** How a `move` was made: the king's base step, or a pattern code. */
export type MoveSource = 'base' | PatternCode;

export type ActionRecord =
  | { kind: 'step'; from: SquareName; to: SquareName }
  | {
      kind: 'warden' | 'strike' | 'king';
      pieceId: string;
      from: SquareName;
      to: SquareName;
      via: MoveSource;
      /** Rider moves: the oriented steps actually walked. Otherwise null. */
      path: StepString | null;
      captured: CapturedPiece | null;
    }
  | {
      kind: 'chart';
      pieceId: string;
      from: SquareName;
      /** Where the Tracer stopped: the path's end, a square along it, or `from`. */
      to: SquareName;
      steps: StepString;
      /** The tracer's new pattern, in charted orientation (also lent to its king). */
      pattern: PatternCode;
    }
  | { kind: 'declare'; pieceId: string; at: SquareName; pattern: PatternCode }
  | { kind: 'pass' };

export interface TurnRecord {
  ply: number;
  side: Side;
  /** In play order: an optional step, the main action, an optional step. */
  actions: ActionRecord[];
  result: GameResult;
}

export type EngineErrorCode =
  | 'BAD_INPUT'
  | 'GAME_OVER'
  | 'NOT_YOUR_TURN'
  | 'STALE_PLY'
  | 'BAD_SQUARE'
  | 'BAD_STEPS'
  | 'NO_PIECE'
  | 'NOT_YOUR_PIECE'
  | 'NOT_A_TRACER'
  | 'UNFORMED_TRACER'
  | 'UNREACHABLE'
  | 'CHART_OFF_BOARD'
  | 'CHART_REVISIT'
  | 'CHART_END_OCCUPIED'
  | 'CHART_TOO_LONG'
  | 'LANDING_OFF_PATH'
  | 'LANDING_NOT_ALLOWED'
  | 'LANDING_OCCUPIED'
  | 'DECLARE_NOT_ALLOWED'
  | 'NOT_DECLARABLE'
  | 'STEP_NOT_ADJACENT'
  | 'STEP_NOT_EMPTY'
  | 'STEP_WITH_KING_MOVE'
  | 'STEP_NOT_ALLOWED'
  | 'STEP_AFTER_WIN'
  | 'PASS_NOT_ALLOWED';

export type TurnPhase = 'turn' | 'before' | 'main' | 'after';

export type TurnOutcome =
  | { ok: true; state: GameState; record: TurnRecord }
  | { ok: false; code: EngineErrorCode; phase: TurnPhase; message: string };

/** A square a piece can move to with a `move` main action. */
export interface MoveTarget {
  to: SquareName;
  capture: boolean;
  via: MoveSource;
  path: StepString | null;
}

/** One oriented rider walk, kept so the UI can draw ghost rays. */
export interface RiderWalk {
  path: StepString;
  /** How many steps of `path` are legal destinations. */
  reached: number;
  stop: 'end' | 'edge' | 'own' | 'enemy';
}
