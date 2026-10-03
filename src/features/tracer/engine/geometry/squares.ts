/**
 * Square indexing. Inside the engine a square is an index 0–63 with
 * `index = rank * 8 + file` (a1 = 0, h1 = 7, a8 = 56); at every boundary it
 * is an algebraic name like `d4`.
 */

import type { SquareName } from '../types';

export const BOARD_SIZE = 8;
export const SQUARE_COUNT = BOARD_SIZE * BOARD_SIZE;

const FILES = 'abcdefgh';
const SQUARE_NAME = /^[a-h][1-8]$/;

export function fileOf(sq: number): number {
  return sq % BOARD_SIZE;
}

export function rankOf(sq: number): number {
  return Math.floor(sq / BOARD_SIZE);
}

export function squareAt(file: number, rank: number): number | null {
  if (file < 0 || file >= BOARD_SIZE || rank < 0 || rank >= BOARD_SIZE) {
    return null;
  }
  return rank * BOARD_SIZE + file;
}

/** Parse an algebraic name strictly; anything else returns null. */
export function parseSquare(name: unknown): number | null {
  if (typeof name !== 'string' || !SQUARE_NAME.test(name)) {
    return null;
  }
  return squareAt(name.charCodeAt(0) - 97, name.charCodeAt(1) - 49);
}

export function squareName(sq: number): SquareName {
  return `${FILES[fileOf(sq)]}${rankOf(sq) + 1}`;
}

/** The square `(dx, dy)` away, or null when that leaves the board. */
export function offsetSquare(sq: number, dx: number, dy: number): number | null {
  return squareAt(fileOf(sq) + dx, rankOf(sq) + dy);
}

/** The up-to-8 squares a king step away. */
export function neighbours(sq: number): number[] {
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const next = offsetSquare(sq, dx, dy);
      if (next !== null) result.push(next);
    }
  }
  return result;
}

export function isNeighbour(a: number, b: number): boolean {
  const dx = Math.abs(fileOf(a) - fileOf(b));
  const dy = Math.abs(rankOf(a) - rankOf(b));
  return Math.max(dx, dy) === 1;
}

/** Every square name, a1..h8 in index order. */
export const ALL_SQUARE_NAMES: readonly SquareName[] = Array.from(
  { length: SQUARE_COUNT },
  (_, sq) => squareName(sq),
);
