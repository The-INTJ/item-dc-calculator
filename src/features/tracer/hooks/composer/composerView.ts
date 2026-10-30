/**
 * Everything the board shows while a turn is being built, derived from the
 * game and the composer state. Pure: the engine does all the rules work, and
 * the staged turn is previewed by actually applying it.
 */

import {
  applyTurn,
  freeStepSquares,
  kingDeclares,
  kingPatterns,
  moveTargets,
  patternTargets,
  pieceAt,
  previewChart,
  stepCombinesWith,
  type ChartPreview,
  type GameState,
  type MoveTarget,
  type PatternCode,
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
  /** Where a drawn chart may stop (its origin = stay put), once the player is picking. */
  landTargets: SquareName[];
  /** Patterns the selected king may declare this turn. */
  declarable: PatternCode[];
  turn: TurnInput | null;
  outcome: TurnOutcome | null;
  /** The staged main action moves the king, so the turn is complete. */
  kingTurn: boolean;
  /** The staged main action may take the free king step along (under this game's rules). */
  stepWithMain: boolean;
}

/** A piece's reach — every square it can move to — with rider rays when a Tracer has a pattern. */
export function pieceReach(board: GameState, piece: Piece): { targets: MoveTarget[]; walks: RiderWalk[] } {
  const walks =
    piece.kind === 'tracer' && piece.pattern ? patternTargets(board, piece.at, piece.side, piece.pattern).walks : [];
  return { targets: moveTargets(board, piece.at), walks };
}

/** The kind of piece the staged main action moves, if one is staged. */
function mainMover(composer: ComposerState, game: GameState): PieceKind | null {
  const main = composer.main;
  if (!main || main.kind === 'pass') return null;
  if (main.kind === 'declare') return 'king';
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
  landTargets: SquareName[];
  declarable: PatternCode[];
}

const NOTHING: Selection = { targets: [], walks: [], chart: null, stepTargets: [], landTargets: [], declarable: [] };

/** A finished chart, frozen while the player picks where its Tracer stops. */
function landingSelection(board: GameState, piece: Piece, steps: string): Selection {
  const chart = previewChart(board, piece.at, steps);
  const empty = chart.squares.filter((square) => !pieceAt(board, square));
  return { ...NOTHING, chart: { ...chart, next: [] }, landTargets: [piece.at, ...empty] };
}

function playSelection(board: GameState, piece: Piece, composer: ComposerState, stepAfterOpen: boolean): Selection {
  if (composer.main) {
    const canStep = piece.kind === 'king' && stepAfterOpen;
    return canStep ? { ...NOTHING, stepTargets: freeStepSquares(board, piece.side) } : NOTHING;
  }
  if (piece.kind === 'tracer' && composer.tracerMode === 'chart') {
    return { ...NOTHING, chart: previewChart(board, piece.at, composer.chart) };
  }
  if (piece.kind === 'tracer' && composer.tracerMode === 'land') return landingSelection(board, piece, composer.chart);
  if (piece.kind === 'king' && composer.stepBefore) return NOTHING;
  const declarable = piece.kind === 'king' && kingDeclares(board.rules) ? kingPatterns(board, piece.side) : [];
  return { ...NOTHING, ...pieceReach(board, piece), declarable: [...new Set(declarable)] };
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
