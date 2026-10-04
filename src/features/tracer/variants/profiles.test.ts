// @vitest-environment node
/**
 * Every game style, checked the same way: adding a style needs no new test.
 * If one of these fails, the style can't be played as defined.
 */

import { describe, expect, it } from 'vitest';

import { hasLegalMainAction, initialState } from '../engine';
import { playGame } from '../engine/fixtures/self-play';
import { layoutById } from './layouts';
import { DEFAULT_STYLE_ID, GAME_STYLES, styleById } from './profiles';
import { RuleSetSchema } from './rule-schema';

describe('the style catalogue', () => {
  it('has unique ids and a default that exists', () => {
    expect(new Set(GAME_STYLES.map((style) => style.id)).size).toBe(GAME_STYLES.length);
    expect(styleById(DEFAULT_STYLE_ID)).not.toBeNull();
  });
});

describe.each(GAME_STYLES.map((style) => [style.name, style] as const))('%s', (_name, style) => {
  it('is valid, frozen, and uses a published layout', () => {
    expect(RuleSetSchema.parse(style.rules)).toEqual(style.rules);
    expect(Object.isFrozen(style.rules.layout.pieces[0])).toBe(true);
    expect(layoutById(style.rules.layout.id)).toEqual(style.rules.layout);
  });

  it('starts mirrored, with one king a side and every piece on its own square', () => {
    const state = initialState(style.rules);
    const white = state.pieces.filter((p) => p.side === 'w');
    const black = state.pieces.filter((p) => p.side === 'b');
    expect(black.map((p) => [p.id.slice(1), p.at[0], 9 - Number(p.at[1])])).toEqual(
      white.map((p) => [p.id.slice(1), p.at[0], Number(p.at[1])]),
    );
    expect(white.filter((p) => p.kind === 'king')).toHaveLength(1);
    expect(new Set(state.pieces.map((p) => p.at)).size).toBe(state.pieces.length);
    expect(new Set(state.pieces.map((p) => p.id)).size).toBe(state.pieces.length);
    expect(hasLegalMainAction(state, 'w')).toBe(true);
  });

  it('plays: seeded games keep every invariant and replay exactly', () => {
    for (const seed of [1, 2, 3, 4, 5]) playGame(style.rules, seed, 80);
  });
});
