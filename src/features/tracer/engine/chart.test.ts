// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { positionFrom } from './fixtures/position';
import { initialState } from './setup';
import { previewChart } from './chart';
import { applyTurn } from './turn';

// Scenario C — a tracer on b1 next to its king, a black warden on d3.
const state = positionFrom(`
  3 . . . w . . . .
  1 . T . K . . . .
`);

function chart(steps: string, freeStep: { to: string; when: 'before' | 'after' } | null = null) {
  return applyTurn(state, 'w', { ply: 0, main: { kind: 'chart', from: 'b1', steps }, freeStep });
}

function chartRecord(steps: string, freeStep?: { to: string; when: 'before' | 'after' }) {
  const outcome = chart(steps, freeStep ?? null);
  if (!outcome.ok) throw new Error(outcome.code);
  return outcome.record.actions.find((action) => action.kind === 'chart');
}

describe('charting', () => {
  it('makes a clean path a rider, keyed canonically', () => {
    expect(chartRecord('966')).toMatchObject({
      to: 'e2', pattern: 'R:966', key: 'R:988', libraryAdded: true,
    });
  });

  it('makes a path through any piece a jumper on its net offset', () => {
    expect(chartRecord('999')).toMatchObject({ to: 'e4', pattern: 'J:3,3', key: 'J:3,3' });
  });

  it.each([
    ['99', 'CHART_END_OCCUPIED'],
    ['91', 'CHART_REVISIT'],
    ['1', 'CHART_OFF_BOARD'],
    ['5', 'BAD_STEPS'],
    ['', 'BAD_STEPS'],
  ])('rejects %j with %s', (steps, code) => {
    expect(chart(steps)).toMatchObject({ ok: false, code, phase: 'main' });
  });

  it('judges the path after a free step taken first', () => {
    // The king steps onto d2, which the same path now passes through.
    expect(chartRecord('966', { to: 'd2', when: 'before' })).toMatchObject({
      pattern: 'J:3,1', key: 'J:1,3',
    });
  });

  it('accepts a 63-square serpentine over an empty board', () => {
    const lone = positionFrom('1 T . . . . . . .');
    const rows = ['6666666', '8', '4444444', '8'];
    const serpentine = (rows.join('').repeat(4) + '6666666').slice(0, 63);
    const outcome = applyTurn(lone, 'w', {
      ply: 0, main: { kind: 'chart', from: 'a1', steps: serpentine }, freeStep: null,
    });
    expect(outcome.ok).toBe(true);
  });

  it('only teaches the library a pattern it does not know yet', () => {
    const known = positionFrom('1 . T . K . . . .', { library: { w: ['R:988'] } });
    const outcome = applyTurn(known, 'w', {
      ply: 0, main: { kind: 'chart', from: 'b1', steps: '966' }, freeStep: null,
    });
    expect(outcome.ok && outcome.state.library.w).toEqual(['R:988']);
  });
});

describe('previewChart', () => {
  it('offers every neighbour before the first tap', () => {
    const preview = previewChart(initialState(), 'b1', '');
    expect(preview.next.sort()).toEqual(['a1', 'a2', 'b2', 'c1', 'c2']);
    expect(preview.canFinish).toBe(false);
  });

  it('cannot finish on an occupied square, but notes the piece', () => {
    const preview = previewChart(initialState(), 'b1', '8');
    expect(preview).toMatchObject({ squares: ['b2'], canFinish: false, touchesPiece: true });
    expect(preview.next).not.toContain('b1');
  });

  it('reports what finishing now would produce', () => {
    const preview = previewChart(initialState(), 'b1', '88');
    expect(preview).toMatchObject({ canFinish: true, kind: 'jumper', pattern: 'J:0,2' });
  });

  it('flags an invalid partial path', () => {
    expect(previewChart(initialState(), 'b1', '2').error).toBe('CHART_OFF_BOARD');
  });
});
