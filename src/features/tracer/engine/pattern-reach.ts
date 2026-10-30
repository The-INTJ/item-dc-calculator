/**
 * Where a pattern reaches from a square.
 *
 * Rider: for each orientation, walk the path. Off the board ends that walk;
 * an empty square is a destination and the walk goes on; an enemy is a
 * capture and the walk stops; an own piece stops the walk short. Charted
 * paths never revisit a square or their origin, so no oriented walk can cross
 * itself or come back through the square the piece is leaving.
 *
 * Jumper: for each image of the net offset, land there unless it is off the
 * board or holds an own piece. Everything in between is ignored.
 *
 * `tracedOnly`: the pattern works in its charted orientation alone, so there
 * is one walk (or one landing square) instead of eight.
 */

import type { PatternCode, RiderWalk, Side, StepString } from './types';
import { images, offsetSquare, orientations, stepFrom } from './geometry';
import { parsePattern } from './pattern-codes';
import { relation, type Board } from './occupancy';

export interface PatternHit {
  sq: number;
  capture: boolean;
  /** Rider hits: the oriented steps walked to get here. Jumper hits: null. */
  path: StepString | null;
}

export interface PatternReach {
  hits: PatternHit[];
  walks: RiderWalk[];
}

function walkOrientation(
  board: Board,
  from: number,
  side: Side,
  path: StepString,
  hits: Map<number, PatternHit>,
): RiderWalk {
  let current = from;
  for (let i = 0; i < path.length; i += 1) {
    const next = stepFrom(current, path[i]);
    if (next === null) return { path, reached: i, stop: 'edge' };
    const rel = relation(board, next, side);
    if (rel === 'own') return { path, reached: i, stop: 'own' };
    if (!hits.has(next)) {
      hits.set(next, { sq: next, capture: rel === 'enemy', path: path.slice(0, i + 1) });
    }
    if (rel === 'enemy') return { path, reached: i + 1, stop: 'enemy' };
    current = next;
  }
  return { path, reached: path.length, stop: 'end' };
}

export function riderReach(
  board: Board,
  from: number,
  side: Side,
  steps: StepString,
  tracedOnly = false,
): PatternReach {
  const hits = new Map<number, PatternHit>();
  const paths = tracedOnly ? [steps] : orientations(steps);
  const walks = paths.map((path) => walkOrientation(board, from, side, path, hits));
  return { hits: [...hits.values()], walks };
}

export function jumperReach(
  board: Board,
  from: number,
  side: Side,
  dx: number,
  dy: number,
  tracedOnly = false,
): PatternHit[] {
  const hits: PatternHit[] = [];
  for (const image of tracedOnly ? [{ dx, dy }] : images({ dx, dy })) {
    const to = offsetSquare(from, image.dx, image.dy);
    if (to === null || relation(board, to, side) === 'own') continue;
    hits.push({ sq: to, capture: relation(board, to, side) === 'enemy', path: null });
  }
  return hits;
}

export function patternReach(
  board: Board,
  from: number,
  side: Side,
  code: PatternCode,
  tracedOnly = false,
): PatternReach {
  const parsed = parsePattern(code);
  if (!parsed) return { hits: [], walks: [] };
  if (parsed.kind === 'rider') return riderReach(board, from, side, parsed.steps, tracedOnly);
  return { hits: jumperReach(board, from, side, parsed.dx, parsed.dy, tracedOnly), walks: [] };
}
