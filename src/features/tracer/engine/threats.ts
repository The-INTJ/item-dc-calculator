/**
 * The squares a side controls: every square it could move a capturing piece
 * onto next turn. An enemy piece on a controlled square can be captured; an
 * empty controlled square is unsafe to step onto.
 *
 * Two kinds of turn can capture:
 *   - a king turn: the king's base step or a pattern its rules let it use,
 *     from where the king stands now;
 *   - a piece turn: a warden step or tracer strike, either straight away or —
 *     where the rules allow a free step with that piece — after a free king
 *     step (which moves the king out of, or into, lines).
 * Charts never capture and the free step never captures, so neither counts.
 */

import type { GameState, Piece, Side, SquareName } from './types';
import { parseSquare, squareName } from './geometry';
import { boardOf, findKing, otherSide } from './occupancy';
import { pieceHits } from './piece-reach';
import { freeStepSquares } from './free-step';
import { kingPatterns, stepCombinesWith } from './rulebook';

/** The piece list as it stands, then once per square the king could step to. */
function launchPositions(state: GameState, side: Side): Piece[][] {
  const king = findKing(state.pieces, side);
  if (!king) return [state.pieces];
  const stepped = freeStepSquares(state, side).map((to) =>
    state.pieces.map((piece) => (piece === king ? { ...piece, at: to } : piece)),
  );
  return [state.pieces, ...stepped];
}

function addReach(target: Set<number>, pieces: Piece[], piece: Piece, state: GameState) {
  const board = boardOf(pieces);
  for (const hit of pieceHits(board, piece, kingPatterns(state, piece.side))) {
    target.add(hit.sq);
  }
}

export function attackedSquares(state: GameState, attacker: Side): SquareName[] {
  const attacked = new Set<number>();
  const king = findKing(state.pieces, attacker);
  if (king) addReach(attacked, state.pieces, king, state);
  launchPositions(state, attacker).forEach((pieces, index) => {
    const afterStep = index > 0;
    for (const piece of pieces) {
      if (piece.side !== attacker || piece.kind === 'king') continue;
      if (afterStep && !stepCombinesWith(state.rules, piece.kind)) continue;
      addReach(attacked, pieces, piece, state);
    }
  });
  return [...attacked].sort((a, b) => a - b).map(squareName);
}

/** Could `side`'s king be captured if the opponent moved next? */
export function isKingInDanger(state: GameState, side: Side): boolean {
  const king = findKing(state.pieces, side);
  if (!king || parseSquare(king.at) === null) return false;
  return attackedSquares(state, otherSide(side)).includes(king.at);
}
