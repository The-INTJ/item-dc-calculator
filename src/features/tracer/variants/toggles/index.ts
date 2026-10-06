/**
 * Every adjustable rule, one toggle per RuleSet field. The registry is a
 * mapped type over RuleSet, so a rule added to RuleSet without a toggle
 * fails to compile. Its key order is the order the lobby lists them in.
 */

import type { RuleSet } from '../../engine';
import { DODGE_DRAW_TOGGLE, DODGE_THREAT_TOGGLE, LONE_KING_TOGGLE } from './endings';
import { KING_BORROW_TOGGLE, KING_MEMORY_TOGGLE } from './king';
import { LAYOUT_TOGGLE } from './layout';
import { TRACER_REACH_TOGGLE } from './tracer-reach';
import { LANDING_TOGGLE, ORIENTATIONS_TOGGLE, TRACER_STEP_TOGGLE } from './tracers';
import { FREE_STEP_TOGGLE } from './turn';
import type { Toggle } from './types';

export const TOGGLES: { [K in keyof RuleSet]: Toggle<K> } = {
  layout: LAYOUT_TOGGLE,
  tracerReach: TRACER_REACH_TOGGLE,
  patternOrientations: ORIENTATIONS_TOGGLE,
  chartLanding: LANDING_TOGGLE,
  tracerStep: TRACER_STEP_TOGGLE,
  kingMemory: KING_MEMORY_TOGGLE,
  kingBorrow: KING_BORROW_TOGGLE,
  freeStep: FREE_STEP_TOGGLE,
  loneKingWins: LONE_KING_TOGGLE,
  dodgeDraw: DODGE_DRAW_TOGGLE,
  dodgeNeedsThreat: DODGE_THREAT_TOGGLE,
};

export const TOGGLE_KEYS = Object.keys(TOGGLES) as (keyof RuleSet)[];

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

/** Whether two rule values play the same, by the toggle's own measure. */
export function sameRule<K extends keyof RuleSet>(key: K, a: RuleSet[K], b: RuleSet[K]): boolean {
  const toggle: Toggle<K> = TOGGLES[key];
  return toggle.same ? toggle.same(a, b) : deepEqual(a, b);
}

/** This rule in words. */
export function describeRule<K extends keyof RuleSet>(key: K, rules: RuleSet): string {
  const toggle: Toggle<K> = TOGGLES[key];
  return toggle.describe(rules[key], rules);
}

export { tierSquares } from './tracer-reach';
export { withRule, type AnyControl, type ControlFor, type Toggle, type ToggleGroup } from './types';
