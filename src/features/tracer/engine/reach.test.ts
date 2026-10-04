// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { positionFrom } from './fixtures/position';
import { TEST_RULES } from './fixtures/rules';
import { initialState } from './setup';
import { moveTargets, patternTargets } from './queries';

function summary(targets: { to: string; capture: boolean }[]) {
  return targets.map((t) => (t.capture ? `x${t.to}` : t.to)).sort();
}

describe('rider reach', () => {
  // Scenario A — a straight rider four squares long.
  const state = positionFrom(
    `
    8 . . . . . . . k
    6 . . . w . . . .
    3 . W . T . . . .
    1 K . . . . . . .
    `,
    { patterns: { d3: 'R:8888' } },
  );

  it('walks each orientation until the edge, an own piece, or a capture', () => {
    expect(summary(moveTargets(state, 'd3'))).toEqual(
      ['c3', 'd1', 'd2', 'd4', 'd5', 'xd6', 'e3', 'f3', 'g3', 'h3'].sort(),
    );
  });

  it('reports how each oriented walk ended', () => {
    const { walks } = patternTargets(state, 'd3', 'w', 'R:8888');
    expect(walks).toEqual([
      { path: '8888', reached: 3, stop: 'enemy' },
      { path: '4444', reached: 1, stop: 'own' },
      { path: '2222', reached: 2, stop: 'edge' },
      { path: '6666', reached: 4, stop: 'end' },
    ]);
  });

  it('records the walked path for each destination', () => {
    const target = moveTargets(state, 'd3').find((t) => t.to === 'd5');
    expect(target).toMatchObject({ via: 'R:8888', path: '88' });
  });

  it('ends a walk where it leaves the board', () => {
    const corner = positionFrom('1 T . . . . . . K', { patterns: { a1: 'R:23' } });
    const { walks, targets } = patternTargets(corner, 'a1', 'w', 'R:23');
    expect(walks.find((w) => w.path === '23')).toEqual({ path: '23', reached: 0, stop: 'edge' });
    expect(walks.find((w) => w.path === '87')).toEqual({ path: '87', reached: 1, stop: 'edge' });
    expect(targets.map((t) => t.to).sort()).toEqual(['a2', 'b1', 'b3', 'c2']);
  });

  it('never lists the starting square, even for a path that circles it', () => {
    const looped = positionFrom('4 . . . T . . . .', { patterns: { d4: 'R:862244' } });
    const targets = moveTargets(looped, 'd4').map((t) => t.to);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets).not.toContain('d4');
  });
});

describe('jumper reach', () => {
  // Scenario B — a (1,2) jumper boxed in by its own wardens.
  const state = positionFrom(
    `
    6 . . w . W . . .
    5 . . W W W . . .
    4 . . W T W . . .
    3 . . W W W . . .
    `,
    { patterns: { d4: 'J:1,2' } },
  );

  it('lands on every image of the offset, ignoring pieces in between', () => {
    expect(summary(moveTargets(state, 'd4'))).toEqual(
      ['b3', 'b5', 'c2', 'xc6', 'e2', 'f3', 'f5'].sort(),
    );
  });
});

describe('piece reach', () => {
  it('gives an unformed tracer no strike targets', () => {
    expect(moveTargets(initialState(TEST_RULES), 'b1')).toEqual([]);
  });

  it('gives wardens one step in any direction, capturing enemies', () => {
    const state = positionFrom('5 . . . . w . . .\n4 . . . W . . . .');
    expect(summary(moveTargets(state, 'd4'))).toEqual(
      ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'xe5'].sort(),
    );
  });

  it('gives the king its base step first, then the patterns its rules lend it', () => {
    const state = positionFrom('1 . . . K . . . .', { lastCharted: { w: { wT1: 'J:0,3' } } });
    const targets = moveTargets(state, 'd1');
    expect(targets.find((t) => t.to === 'd2')?.via).toBe('base');
    expect(targets.find((t) => t.to === 'd4')?.via).toBe('J:0,3');
    expect(targets.find((t) => t.to === 'a1')?.via).toBe('J:0,3');
  });
});
