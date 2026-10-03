/**
 * Numpad direction digits. Each digit is one king step, laid out like a
 * keypad with north (toward rank 8) at the top:
 *
 *     7 8 9
 *     4 · 6
 *     1 2 3
 */

import type { StepString } from '../types';
import { offsetSquare } from './squares';

export interface Vec {
  dx: number;
  dy: number;
}

export const MAX_PATH_LENGTH = 63;

const STEP_STRING = /^[1-46-9]{1,63}$/;

const DIGIT_VECTORS: Readonly<Record<string, Vec>> = {
  '1': { dx: -1, dy: -1 },
  '2': { dx: 0, dy: -1 },
  '3': { dx: 1, dy: -1 },
  '4': { dx: -1, dy: 0 },
  '6': { dx: 1, dy: 0 },
  '7': { dx: -1, dy: 1 },
  '8': { dx: 0, dy: 1 },
  '9': { dx: 1, dy: 1 },
};

export function isStepString(value: unknown): value is StepString {
  return typeof value === 'string' && STEP_STRING.test(value);
}

export function digitVector(digit: string): Vec {
  const vec = DIGIT_VECTORS[digit];
  if (!vec) {
    throw new Error(`Not a direction digit: ${digit}`);
  }
  return vec;
}

/** The digit for a single king step, or null when `(dx, dy)` isn't one. */
export function vectorDigit(dx: number, dy: number): string | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) !== 1) return null;
  return String(5 + dx + 3 * dy);
}

/** The square one step from `sq` in direction `digit`, or null off-board. */
export function stepFrom(sq: number, digit: string): number | null {
  const { dx, dy } = digitVector(digit);
  return offsetSquare(sq, dx, dy);
}

/** Start-to-finish displacement of a whole path. */
export function netDisplacement(steps: StepString): Vec {
  let dx = 0;
  let dy = 0;
  for (const digit of steps) {
    const vec = digitVector(digit);
    dx += vec.dx;
    dy += vec.dy;
  }
  return { dx, dy };
}
