/**
 * Tracer rules engine — pure functions over plain data, shared by the browser
 * (move highlighting, previews) and the server (authoritative validation).
 */

export type * from './types';
export { initialState } from './setup';
export { applyTurn, sideToMove } from './turn';
export { agreeDraw, resign } from './outcome';
export {
  chartLimit,
  dodgeLimit,
  FREE_STEP,
  hasChartLimit,
  KING_MEMORY,
  kingPatterns,
  loneKingWins,
  stepCombinesWith,
} from './rulebook';
export { previewChart, type ChartPreview } from './chart';
export { freeStepSquares } from './free-step';
export { attackedSquares, isKingInDanger } from './threats';
export { hasLegalMainAction } from './legality';
export {
  moveTargets,
  pathSquares,
  patternTargets,
  pieceAt,
  squareCoords,
  squareFromCoords,
  stepDigit,
  withKingAt,
} from './queries';
export { canonicalKey, parsePattern, patternKind, type ParsedPattern } from './pattern-codes';
export { formatAction, formatTurn, turnNumberLabel } from './notation';
export { replayTurns, turnInputFromRecord } from './replay';
export { engineMessage } from './engine-error';
export { otherSide } from './occupancy';
export {
  ALL_SQUARE_NAMES,
  digitVector,
  isStepString,
  MAX_PATH_LENGTH,
  netDisplacement,
} from './geometry';
