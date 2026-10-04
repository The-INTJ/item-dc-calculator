/**
 * Everything the board shows while a turn is being built, derived from the
 * game and the composer state. Pure: the engine does all the rules work, and
 * the staged turn is previewed by actually applying it.
 */

import {
  applyTurn,
  freeStepSquares,
  moveTargets,
  patternTargets,
  pieceAt,
  previewChart,
  stepCombinesWith,
  type ChartPreview,
  type GameState,
  type MoveTarget,
  type Piece,
  type PieceKind,
  type RiderWalk,
  type Side,
  type SquareName,
  type TurnInput,
  type TurnOutcome,
} from '../../engine';
import { turnFromComposer, type ComposerState } from './composerState';

export interface ComposerView {
  /** The position after everything staged so far — what the board draws. */
  board: GameState;
  selectedPiece: Piece | null;
  /** The selection is only being looked at (not the mover's piece, or not their turn). */
  inspecting: boolean;
  targets: MoveTarget[];
  walks: RiderWalk[];
  chart: ChartPreview | null;
  /** Squares the king may take its free step to, once a piece move is staged. */
  stepTargets: SquareName[];
  turn: TurnInput | null;
  outcome: TurnOutcome | null;
  /** The staged main action moves the king, so the turn is complete. */
  kingTurn: boolean;
  /** The staged main action may take the free king step along (under this game's rules). */
  stepWithMain: boolean;
}

/** A piece's reach for inspection, with rider rays when it has a pattern. */
export function pieceReach(board: GameState, piece: Piece): { targets: MoveTarget[]; walks: RiderWalk[] } {
  if (piece.kind === 'tracer') {
    return piece.pattern ? patternTargets(board, piece.at, piece.side, piece.pattern) : { targets: [], walks: [] };
  }
  return { targets: moveTargets(board, piece.at), walks: [] };
}

/** The kind of piece the staged main action moves, if one is staged. */
function mainMover(composer: ComposerState, game: GameState): PieceKind | null {
  const main = composer.main;
  if (!main || main.kind === 'pass') return null;
  return main.kind === 'chart' ? 'tracer' : (pieceAt(game, main.from)?.kind ?? null);
}

/** With a quiet king step staged first, only pieces that may take it along can still move. */
function canJoinStep(game: GameState, composer: ComposerState, piece: Piece): boolean {
  return !composer.stepBefore || piece.kind === 'king' || stepCombinesWith(game.rules, piece.kind);
}

interface Selection {
  targets: MoveTarget[];
  walks: RiderWalk[];
  chart: ChartPreview | null;
  stepTargets: SquareName[];
}

const NOTHING: Selection = { targets: [], walks: [], chart: null, stepTargets: [] };

function playSelection(board: GameState, piece: Piece, composer: ComposerState, stepAfterOpen: boolean): Selection {
  if (composer.main) {
    const canStep = piece.kind === 'king' && stepAfterOpen;
    return canStep ? { ...NOTHING, stepTargets: freeStepSquares(board, piece.side) } : NOTHING;
  }
  if (piece.kind === 'tracer' && composer.tracerMode === 'chart') {
    return { ...NOTHING, chart: previewChart(board, piece.at, composer.chart) };
  }
  if (piece.kind === 'king' && composer.stepBefore) return NOTHING;
  return { ...NOTHING, ...pieceReach(board, piece) };
}

export function composeView(
  game: GameState,
  side: Side | null,
  canMove: boolean,
  composer: ComposerState,
): ComposerView {
  const turn = side && canMove ? turnFromComposer(composer, game, side) : null;
  const outcome = turn && side ? applyTurn(game, side, turn) : null;
  const board = outcome?.ok ? outcome.state : game;
  const selectedPiece = composer.selected ? pieceAt(board, composer.selected) : null;
  const playing =
    selectedPiece !== null && canMove && selectedPiece.side === side && canJoinStep(game, composer, selectedPiece);
  const mover = mainMover(composer, game);
  const stepWithMain = mover !== null && mover !== 'king' && stepCombinesWith(game.rules, mover);
  const stepAfterOpen =
    stepWithMain && !composer.stepBefore && !composer.stepAfter && board.result.status === 'active';
  let selection = NOTHING;
  if (selectedPiece && playing) selection = playSelection(board, selectedPiece, composer, stepAfterOpen);
  else if (selectedPiece) selection = { ...NOTHING, ...pieceReach(board, selectedPiece) };
  return {
    board,
    selectedPiece,
    inspecting: selectedPiece !== null && !playing,
    ...selection,
    turn,
    outcome,
    kingTurn: side !== null && mover === 'king',
    stepWithMain,
  };
}
