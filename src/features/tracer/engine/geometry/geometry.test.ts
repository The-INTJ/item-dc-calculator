// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  ALL_SQUARE_NAMES,
  images,
  isStepString,
  neighbours,
  netDisplacement,
  orientations,
  parseSquare,
  squareName,
  SYMMETRIES,
  transformSteps,
  vectorDigit,
} from './index';

const DIGITS = '12346789';

describe('squares', () => {
  it('round-trips every square name', () => {
    expect(ALL_SQUARE_NAMES).toHaveLength(64);
    ALL_SQUARE_NAMES.forEach((name, index) => {
      expect(parseSquare(name)).toBe(index);
      expect(squareName(index)).toBe(name);
    });
    expect(parseSquare('a1')).toBe(0);
    expect(parseSquare('h1')).toBe(7);
    expect(parseSquare('a8')).toBe(56);
  });

  it.each(['i1', 'a0', 'a9', 'A1', 'd10', '', ' d4', 'd4 ', 42, null])(
    'rejects %j',
    (value) => {
      expect(parseSquare(value)).toBeNull();
    },
  );

  it('counts neighbours at corners, edges and inside', () => {
    expect(neighbours(parseSquare('a1')!)).toHaveLength(3);
    expect(neighbours(parseSquare('a4')!)).toHaveLength(5);
    expect(neighbours(parseSquare('d4')!)).toHaveLength(8);
  });
});

describe('direction digits', () => {
  it('maps single king steps to numpad digits', () => {
    expect(vectorDigit(0, 1)).toBe('8');
    expect(vectorDigit(1, 1)).toBe('9');
    expect(vectorDigit(-1, -1)).toBe('1');
    expect(vectorDigit(1, 0)).toBe('6');
    expect(vectorDigit(0, 0)).toBeNull();
    expect(vectorDigit(2, 1)).toBeNull();
  });

  it.each(['0', '5', 'x', '', '86a', '8'.repeat(64)])('rejects step string %j', (steps) => {
    expect(isStepString(steps)).toBe(false);
  });

  it('accepts up to 63 steps', () => {
    expect(isStepString('8'.repeat(63))).toBe(true);
  });

  it('sums a path into its net displacement', () => {
    expect(netDisplacement('8888887')).toEqual({ dx: -1, dy: 7 });
    expect(netDisplacement('9631')).toEqual({ dx: 2, dy: -1 });
  });
});

describe('symmetries', () => {
  const tables = SYMMETRIES.map((sym) => transformSteps(sym, DIGITS));

  it('match the literal digit tables', () => {
    expect(tables).toEqual([
      '12346789', // identity
      '36928147', // rotate 90° ccw
      '98764321', // rotate 180°
      '74182963', // rotate 270° ccw
      '32164987', // mirror left–right
      '78946123', // mirror top–bottom
      '14728369', // transpose
      '96382741', // anti-transpose
    ]);
  });

  it('are permutations that form a closed group', () => {
    const tableSet = new Set(tables);
    for (const table of tables) {
      expect(new Set(table).size).toBe(8);
      for (const sym of SYMMETRIES) {
        expect(tableSet.has(transformSteps(sym, table))).toBe(true);
      }
    }
  });

  it('rotating 180° maps each digit d to 10 − d', () => {
    for (const digit of DIGITS) {
      expect(transformSteps(SYMMETRIES[2], digit)).toBe(String(10 - Number(digit)));
    }
  });

  it('dedupes symmetric paths', () => {
    expect(orientations('8888')).toHaveLength(4);
    expect(orientations('99')).toHaveLength(4);
    expect(orientations('89')).toHaveLength(8);
    expect(images({ dx: 0, dy: 3 })).toHaveLength(4);
    expect(images({ dx: 2, dy: 2 })).toHaveLength(4);
    expect(images({ dx: 1, dy: 2 })).toHaveLength(8);
  });
});
