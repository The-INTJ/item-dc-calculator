/**
 * The eight symmetries of the square: four rotations, each also mirrored.
 * Every pattern works in all eight orientations, the same way chess pieces
 * move in every direction.
 *
 * A symmetry is a 2×2 integer matrix acting on (dx, dy). Acting on a step
 * string is digit-by-digit, because each symmetry maps king steps to king
 * steps. The order below is fixed: when several orientations reach the same
 * square, the earliest one is the one recorded.
 */

import type { StepString } from '../types';
import { digitVector, vectorDigit, type Vec } from './directions';

/** `[a, b, c, d]` maps (dx, dy) to (a·dx + b·dy, c·dx + d·dy). */
export type Symmetry = readonly [number, number, number, number];

export const SYMMETRIES: readonly Symmetry[] = [
  [1, 0, 0, 1], // identity
  [0, -1, 1, 0], // rotate 90° counter-clockwise
  [-1, 0, 0, -1], // rotate 180°
  [0, 1, -1, 0], // rotate 270° counter-clockwise
  [-1, 0, 0, 1], // mirror left–right
  [1, 0, 0, -1], // mirror top–bottom
  [0, 1, 1, 0], // transpose
  [0, -1, -1, 0], // anti-transpose
];

export function applySymmetry(sym: Symmetry, { dx, dy }: Vec): Vec {
  const [a, b, c, d] = sym;
  return { dx: a * dx + b * dy, dy: c * dx + d * dy };
}

export function transformDigit(sym: Symmetry, digit: string): string {
  const { dx, dy } = applySymmetry(sym, digitVector(digit));
  const result = vectorDigit(dx, dy);
  if (result === null) {
    throw new Error(`Symmetry broke a king step: ${digit}`);
  }
  return result;
}

export function transformSteps(sym: Symmetry, steps: StepString): StepString {
  let result = '';
  for (const digit of steps) {
    result += transformDigit(sym, digit);
  }
  return result;
}

/** The distinct orientations of a path, in `SYMMETRIES` order. */
export function orientations(steps: StepString): StepString[] {
  const seen = new Set<StepString>();
  for (const sym of SYMMETRIES) {
    seen.add(transformSteps(sym, steps));
  }
  return [...seen];
}

/** The distinct images of an offset, in `SYMMETRIES` order. */
export function images(offset: Vec): Vec[] {
  const seen = new Map<string, Vec>();
  for (const sym of SYMMETRIES) {
    const image = applySymmetry(sym, offset);
    seen.set(`${image.dx},${image.dy}`, image);
  }
  return [...seen.values()];
}
