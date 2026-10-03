/**
 * Player-facing explanations for every way the engine can reject a turn.
 */

import type { EngineErrorCode, TurnOutcome, TurnPhase } from './types';

const MESSAGES: Record<EngineErrorCode, string> = {
  BAD_INPUT: 'That turn could not be read.',
  GAME_OVER: 'The game is already over.',
  NOT_YOUR_TURN: 'It is not your turn.',
  STALE_PLY: 'The board changed since you started this turn.',
  BAD_SQUARE: 'That is not a square on the board.',
  BAD_STEPS: 'That path could not be read.',
  NO_PIECE: 'There is no piece on that square.',
  NOT_YOUR_PIECE: 'That piece belongs to your opponent.',
  NOT_A_TRACER: 'Only Tracers can chart a path.',
  UNFORMED_TRACER: 'This Tracer has no pattern yet — chart one first.',
  UNREACHABLE: 'That piece cannot reach that square.',
  CHART_OFF_BOARD: 'The path runs off the board.',
  CHART_REVISIT: 'A path cannot cross itself or return to its start.',
  CHART_END_OCCUPIED: 'A path must end on an empty square.',
  STEP_NOT_ADJACENT: 'The free king step must be to a neighbouring square.',
  STEP_NOT_EMPTY: 'The free king step must be to an empty square.',
  STEP_WITH_KING_MOVE: 'A king move is the whole turn — no free step with it.',
  STEP_AFTER_WIN: 'The game ended before the free step.',
  PASS_NOT_ALLOWED: 'You have a legal move, so you cannot pass.',
};

export function engineMessage(code: EngineErrorCode): string {
  return MESSAGES[code];
}

export function turnFailure(code: EngineErrorCode, phase: TurnPhase): TurnOutcome {
  return { ok: false, code, phase, message: MESSAGES[code] };
}
