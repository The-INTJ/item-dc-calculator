/**
 * Game styles: named rule sets, defined only here in code. A player picks
 * one before a game (and may tweak its rules); the game then carries its own
 * copy of the rules, so nothing here is read again once it starts.
 *
 * Published styles are frozen. To change how Tracer plays, add a style —
 * don't edit one: friends' links and saved games name these ids, and the v1
 * golden test replays real Original games against ORIGINAL_V1.
 */

import type { RuleSet } from '../engine';
import { CLASSIC_LAYOUT, SPACED_LAYOUT } from './layouts';

export interface GameStyle {
  id: string;
  name: string;
  /** One line for the style picker. */
  summary: string;
  rules: RuleSet;
}

/** The parts of a style a game keeps, to say which style it was started from. */
export interface StyleRef {
  id: string;
  name: string;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const ORIGINAL_V1: GameStyle = deepFreeze({
  id: 'v1-original',
  name: 'Original (v1)',
  summary: 'Tracers chart paths of any length, and the king learns every pattern its side ever charts.',
  rules: {
    layout: SPACED_LAYOUT,
    tracerReach: { limited: false, limits: [3, 5, 8] },
    kingMemory: 'every-chart',
    freeStep: 'with-tracer-or-warden',
    loneKingWins: true,
    dodgeDraw: 6,
  },
});

export const TIERED_V2: GameStyle = deepFreeze({
  id: 'v2-tiered',
  name: 'Tiered (v2)',
  summary: 'Tracers chart up to 3, 5 or 8 steps, and the king borrows each one’s latest pattern — keeping it if that Tracer falls.',
  rules: {
    layout: CLASSIC_LAYOUT,
    tracerReach: { limited: true, limits: [3, 5, 8] },
    kingMemory: 'current-kept',
    freeStep: 'with-tracer-or-warden',
    loneKingWins: true,
    dodgeDraw: 6,
  },
});

/** In picker order. */
export const GAME_STYLES: readonly GameStyle[] = [TIERED_V2, ORIGINAL_V1];

export const DEFAULT_STYLE_ID = TIERED_V2.id;

export function styleById(id: string): GameStyle | null {
  return GAME_STYLES.find((style) => style.id === id) ?? null;
}

export function styleRef(style: GameStyle): StyleRef {
  return { id: style.id, name: style.name };
}
