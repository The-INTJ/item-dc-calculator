/**
 * Pattern codes.
 *
 *   R:<steps>   a rider — walks its oriented path, may stop on any square
 *   J:<dx>,<dy> a jumper — lands exactly on the oriented net offset
 *
 * A jump whose net offset is a single king step behaves exactly like the
 * one-step rider in that direction, so it is stored as that rider. Canonical
 * keys identify a pattern up to the eight symmetries: rider keys use the
 * largest oriented step string (`R:221` → `R:889`), jumper keys the sorted
 * absolute offset (`J:-2,1` → `J:1,2`).
 */

import type { PatternCode, StepString } from './types';
import { isStepString, netDisplacement, orientations, vectorDigit, type Vec } from './geometry';

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

/** Canonical key: patterns that are rotations or mirrors of each other share one key. */
export function canonicalKey(code: PatternCode): PatternCode {
  const parsed = parsePattern(code);
  if (!parsed) {
    throw new Error(`Invalid pattern code: ${code}`);
  }
  if (parsed.kind === 'rider') {
    const best = orientations(parsed.steps).reduce((a, b) => (b > a ? b : a));
    return riderCode(best);
  }
  const a = Math.min(Math.abs(parsed.dx), Math.abs(parsed.dy));
  const b = Math.max(Math.abs(parsed.dx), Math.abs(parsed.dy));
  return jumperCode({ dx: a, dy: b });
}
