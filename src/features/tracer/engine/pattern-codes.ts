/**
 * Pattern codes.
 *
 *   R:<steps>   a rider — walks its oriented path, may stop on any square
 *   J:<dx>,<dy> a jumper — lands exactly on the oriented net offset
 *
 * A jump whose net offset is a single king step behaves exactly like the
 * one-step rider in that direction, so it is stored as that rider.
 */

import type { GameState, PatternCode, Side, StepString } from './types';
import { isStepString, netDisplacement, vectorDigit, type Vec } from './geometry';

export type ParsedPattern =
  | { kind: 'rider'; steps: StepString }
  | { kind: 'jumper'; dx: number; dy: number };

const JUMPER_CODE = /^J:(-?\d),(-?\d)$/;
const MAX_OFFSET = 7;

export function riderCode(steps: StepString): PatternCode {
  return `R:${steps}`;
}

export function jumperCode({ dx, dy }: Vec): PatternCode {
  return `J:${dx},${dy}`;
}

/** Parse and validate a pattern code; anything malformed returns null. */
export function parsePattern(code: unknown): ParsedPattern | null {
  if (typeof code !== 'string') return null;
  if (code.startsWith('R:')) {
    const steps = code.slice(2);
    return isStepString(steps) ? { kind: 'rider', steps } : null;
  }
  const match = JUMPER_CODE.exec(code);
  if (!match) return null;
  const dx = Number(match[1]);
  const dy = Number(match[2]);
  const reach = Math.max(Math.abs(dx), Math.abs(dy));
  if (reach < 2 || reach > MAX_OFFSET) return null;
  return { kind: 'jumper', dx, dy };
}

/** The pattern a charted path produces, given whether it passed a piece. */
export function chartedPattern(steps: StepString, jumped: boolean): PatternCode {
  if (!jumped) return riderCode(steps);
  const net = netDisplacement(steps);
  const single = vectorDigit(net.dx, net.dy);
  return single === null ? jumperCode(net) : riderCode(single);
}

export function patternKind(code: PatternCode): 'rider' | 'jumper' | null {
  return parsePattern(code)?.kind ?? null;
}

/**
 * The patterns `side`'s king may use besides its one-square step: one per
 * Tracer that has charted, ordered by Tracer id (3-step, 5-step, 8-step).
 */
export function kingPatternList(state: Pick<GameState, 'kingPatterns'>, side: Side): PatternCode[] {
  const lent = state.kingPatterns[side];
  return Object.keys(lent)
    .sort()
    .map((tracerId) => lent[tracerId]);
}
