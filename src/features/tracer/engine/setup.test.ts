// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { initialState } from './setup';

describe('initialState', () => {
  const state = initialState();
  const at = (id: string) => state.pieces.find((p) => p.id === id)?.at;

  it('places the classic-style layout, mirrored for Black', () => {
    expect([at('wT3'), at('wT8'), at('wK'), at('wT5')]).toEqual(['b1', 'd1', 'e1', 'g1']);
    expect([at('bT3'), at('bT8'), at('bK'), at('bT5')]).toEqual(['b8', 'd8', 'e8', 'g8']);
    expect(['wW1', 'wW2', 'wW3', 'wW4'].map(at)).toEqual(['b2', 'd2', 'e2', 'g2']);
    expect(['bW1', 'bW2', 'bW3', 'bW4'].map(at)).toEqual(['b7', 'd7', 'e7', 'g7']);
  });

  it('starts each 8-step Tracer on its own colour', () => {
    // d1 is a light square, d8 a dark one.
    expect(at('wT8')).toBe('d1');
    expect(at('bT8')).toBe('d8');
  });

  it('gives Tracers their step limits and nothing else a limit', () => {
    const range = (id: string) => state.pieces.find((p) => p.id === id)?.range;
    expect(['wT3', 'wT5', 'wT8'].map(range)).toEqual([3, 5, 8]);
    expect(['bK', 'bW1'].map(range)).toEqual([null, null]);
  });

  it('gives every piece a unique id and square', () => {
    expect(state.pieces).toHaveLength(16);
    expect(new Set(state.pieces.map((p) => p.id)).size).toBe(16);
    expect(new Set(state.pieces.map((p) => p.at)).size).toBe(16);
  });

  it('starts with unformed tracers, nothing lent to the kings, and White to move', () => {
    expect(state.pieces.every((p) => p.pattern === null)).toBe(true);
    expect(state.kingPatterns).toEqual({ w: {}, b: {} });
    expect(state.stepStreak).toEqual({ w: 0, b: 0 });
    expect(state.ply).toBe(0);
    expect(state.result).toEqual({ status: 'active' });
  });

  it('returns a fresh object every time', () => {
    expect(initialState()).not.toBe(initialState());
    expect(initialState()).toEqual(initialState());
  });
});
