// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { initialState } from './setup';

describe('initialState', () => {
  const state = initialState();

  it('places the spaced layout, mirrored for Black', () => {
    const at = (id: string) => state.pieces.find((p) => p.id === id)?.at;
    expect(at('wK')).toBe('d1');
    expect(at('bK')).toBe('d8');
    expect(['wT1', 'wT2', 'wT3'].map(at)).toEqual(['b1', 'f1', 'h1']);
    expect(['bW1', 'bW2', 'bW3', 'bW4'].map(at)).toEqual(['b7', 'd7', 'f7', 'h7']);
  });

  it('gives every piece a unique id and square', () => {
    expect(state.pieces).toHaveLength(16);
    expect(new Set(state.pieces.map((p) => p.id)).size).toBe(16);
    expect(new Set(state.pieces.map((p) => p.at)).size).toBe(16);
  });

  it('starts with unformed tracers, empty libraries and White to move', () => {
    expect(state.pieces.every((p) => p.pattern === null)).toBe(true);
    expect(state.library).toEqual({ w: [], b: [] });
    expect(state.stepStreak).toEqual({ w: 0, b: 0 });
    expect(state.ply).toBe(0);
    expect(state.result).toEqual({ status: 'active' });
  });

  it('returns a fresh object every time', () => {
    expect(initialState()).not.toBe(initialState());
    expect(initialState()).toEqual(initialState());
  });
});
