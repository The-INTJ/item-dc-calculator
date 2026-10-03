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
  /** Stable id: `wK`, `wT3`/`wT5`/`wT8` (by step limit), `wW1`..`wW4`, and the same with `b`. */
  id: string;
  side: Side;
  kind: PieceKind;
  at: SquareName;
  /** Tracers only: the current pattern, or null while unformed. */
  pattern: PatternCode | null;
  /** Tracers only: the most squares one chart may cover (3, 5 or 8). Null = no limit. */
  range: number | null;
}

export type WinReason = 'king-capture' | 'lone-king' | 'resignation';
export type DrawReason = 'step-streak' | 'agreement';

export type GameResult =
  | { status: 'active' }
  | { status: 'won'; winner: Side; reason: WinReason; atPly: number }
  | { status: 'drawn'; reason: DrawReason; atPly: number };

export interface GameState {
  rulesVersion: 2;
  /** Turns played so far. White moves on even plies, Black on odd. */
  ply: number;
  pieces: Piece[];
  /**
   * The patterns each king borrows, keyed by the Tracer that lends them: a
   * Tracer's current pattern, or — once it has been captured — its last one.
   */
  kingPatterns: Record<Side, Record<string, PatternCode>>;
  /** Consecutive own turns that took the free king step with no capture. */
  stepStreak: Record<Side, number>;
  result: GameResult;
}

/**
 * The one main action of a turn. `move` covers a warden step, a tracer
 * strike, and a king move (base step or a borrowed pattern): the piece standing
 * on `from` decides which. `pass` exists for future variants and is never
 * legal in v1, because a legal main action always exists.
 */
export type MainAction =
  | { kind: 'move'; from: SquareName; to: SquareName }
  | { kind: 'chart'; from: SquareName; steps: StepString }
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
      to: SquareName;
      steps: StepString;
      /** The tracer's new pattern, in charted orientation (also lent to its king). */
      pattern: PatternCode;
    }
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
  | 'STEP_NOT_ADJACENT'
  | 'STEP_NOT_EMPTY'
  | 'STEP_WITH_KING_MOVE'
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
