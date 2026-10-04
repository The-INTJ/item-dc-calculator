/**
 * Tweaks: where a game's rules differ from the style they started from —
 * the "2 tweaks" count on the style chip and the "changed" badges.
 */

import type { RuleSet } from '../engine';
import type { GameStyle } from './profiles';
import { sameRule, TOGGLE_KEYS } from './toggles';

/** The rules that differ from the style's own, in toggle order. */
export function tweaksBetween(style: GameStyle, rules: RuleSet): (keyof RuleSet)[] {
  return TOGGLE_KEYS.filter((key) => !sameRule(key, style.rules[key], rules[key]));
}

/** "Tiered (v2)", "Tiered (v2) · 1 tweak", "Tiered (v2) · 2 tweaks". */
export function styleLabel(styleName: string, tweakCount: number): string {
  if (tweakCount === 0) return styleName;
  return `${styleName} · ${tweakCount} ${tweakCount === 1 ? 'tweak' : 'tweaks'}`;
}
