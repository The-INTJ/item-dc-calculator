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
 *
 * `threatMap` also names the pieces behind each square, for drawing their
 * lines; `defenders` does the same for a side's own pieces it could recapture.
 */

import type { GameState, MoveSource, Piece, Side, SquareName, StepString } from './types';
import { parseSquare, squareName } from './geometry';
import { boardOf, findKing, otherSide } from './occupancy';
import { pieceHits } from './piece-reach';
import { freeStepSquares } from './free-step';
import { kingPatterns, stepCombinesWith } from './rulebook';

/** One piece's hold on one square. */
export interface Threat {
  pieceId: string;
  from: SquareName;
  via: MoveSource;
  /** Rider moves: the oriented steps walked to the square. Otherwise null. */
  path: StepString | null;
  /** Set when the move needs the side's free king step first: where the king steps. */
  afterStep: SquareName | null;
}

/** Controlled squares, in board order, each with the pieces that control it. */
export type ThreatMap = Map<SquareName, Threat[]>;

interface Launch {
  pieces: Piece[];
  afterStep: SquareName | null;
}

/** The piece list as it stands, then once per square the king could step to. */
function launchPositions(state: GameState, side: Side): Launch[] {
  const king = findKing(state.pieces, side);
  if (!king) return [{ pieces: state.pieces, afterStep: null }];
  const stepped = freeStepSquares(state, side).map((to) => ({
    pieces: state.pieces.map((piece) => (piece === king ? { ...piece, at: to } : piece)),
    afterStep: to,
  }));
  return [{ pieces: state.pieces, afterStep: null }, ...stepped];
}

function addReach(found: Map<number, Threat[]>, launch: Launch, piece: Piece, state: GameState) {
  for (const hit of pieceHits(boardOf(launch.pieces), piece, kingPatterns(state, piece.side))) {
    const threats = found.get(hit.sq) ?? [];
    if (threats.some((threat) => threat.pieceId === piece.id)) continue;
    threats.push({ pieceId: piece.id, from: piece.at, via: hit.via, path: hit.path, afterStep: launch.afterStep });
    found.set(hit.sq, threats);
  }
}

export function threatMap(state: GameState, attacker: Side): ThreatMap {
  const found = new Map<number, Threat[]>();
  const king = findKing(state.pieces, attacker);
  if (king) addReach(found, { pieces: state.pieces, afterStep: null }, king, state);
  for (const launch of launchPositions(state, attacker)) {
    for (const piece of launch.pieces) {
      if (piece.side !== attacker || piece.kind === 'king') continue;
      if (launch.afterStep && !stepCombinesWith(state.rules, piece.kind)) continue;
      addReach(found, launch, piece, state);
    }
  }
  const ordered = [...found.entries()].sort(([a], [b]) => a - b);
  return new Map(ordered.map(([sq, threats]) => [squareName(sq), threats]));
}

export function attackedSquares(state: GameState, attacker: Side): SquareName[] {
  return [...threatMap(state, attacker).keys()];
}

/**
 * `side`'s own pieces (not its king) that it could recapture on if an enemy
 * took them, with the pieces that would do it — found by handing each piece
 * to the enemy in turn and asking who then attacks its square.
 */
export function defenders(state: GameState, side: Side): ThreatMap {
  const found: ThreatMap = new Map();
  for (const piece of state.pieces) {
    if (piece.side !== side || piece.kind === 'king') continue;
    const taken = state.pieces.map((p) => (p === piece ? { ...p, side: otherSide(side) } : p));
    const guards = threatMap({ ...state, pieces: taken }, side).get(piece.at);
    if (guards) found.set(piece.at, guards);
  }
  return found;
}

/** Everywhere `side` could capture next turn: the squares it attacks plus its own defended pieces. */
export function controlMap(state: GameState, side: Side): ThreatMap {
  const map = threatMap(state, side);
  defenders(state, side).forEach((guards, square) => map.set(square, guards));
  return map;
}

/** Could `side`'s king be captured if the opponent moved next? */
export function isKingInDanger(state: GameState, side: Side): boolean {
  const king = findKing(state.pieces, side);
  if (!king || parseSquare(king.at) === null) return false;
  return threatMap(state, otherSide(side)).has(king.at);
}
