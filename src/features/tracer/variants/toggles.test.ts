// @vitest-environment node
/**
 * Every toggle, every sample value, under every style — checked the same
 * way, so adding a toggle or a style needs no new test. A failure here means
 * a rule change could start a game that is invalid, unshareable or broken.
 */

import { describe, expect, it } from 'vitest';

import type { RuleSet } from '../engine';
import { playGame } from '../engine/fixtures/self-play';
import { GAME_STYLES } from './profiles';
import { RuleSetSchema } from './rule-schema';
import { parseSetupParams, setupParams } from './share';
import { describeRule, sameRule, TOGGLE_KEYS, TOGGLES, withRule } from './toggles';
import { tweaksBetween } from './tweaks';

describe('the toggle registry', () => {
  it('covers every rule exactly once, with unique link parameters', () => {
    expect([...TOGGLE_KEYS].sort()).toEqual(Object.keys(RuleSetSchema.shape).sort());
    const params = TOGGLE_KEYS.map((key) => TOGGLES[key].param);
    expect(new Set([...params, 'style']).size).toBe(params.length + 1);
  });

  it('reads an untouched style as having no tweaks, and its link as just the style', () => {
    for (const style of GAME_STYLES) {
      expect(tweaksBetween(style, style.rules)).toEqual([]);
      expect(setupParams({ styleId: style.id, rules: style.rules }).toString()).toBe(`style=${style.id}`);
    }
  });

  it('reports unreadable link values instead of failing', () => {
    const parsed = parseSetupParams(new URLSearchParams('style=nope&king=sometimes&dodge=-1&reach=0-0'));
    expect(parsed.styleId).toBe(GAME_STYLES[0].id);
    expect(parsed.rules).toEqual(GAME_STYLES[0].rules);
    expect(parsed.ignored).toEqual(['style=nope', 'reach=0-0', 'king=sometimes', 'dodge=-1']);
  });
});

function samplesFor<K extends keyof RuleSet>(key: K): [K, RuleSet[K]][] {
  return TOGGLES[key].samples.map((value): [K, RuleSet[K]] => [key, value]);
}

const CASES = GAME_STYLES.flatMap((style) =>
  TOGGLE_KEYS.flatMap((key) => samplesFor(key)).map(([key, value]) => ({ style, key, value })),
);

describe.each(CASES.map((c) => [`${c.style.id} · ${c.key} = ${JSON.stringify(c.value)}`, c] as const))(
  '%s',
  (_label, { style, key, value }) => {
    const rules = withRule(style.rules, key, value as never);

    it('makes a valid, describable, shareable rule set that plays', () => {
      expect(RuleSetSchema.safeParse(rules).success).toBe(true);
      expect(describeRule(key, rules).length).toBeGreaterThan(10);
      const changed = !sameRule(key, style.rules[key], rules[key]);
      expect(tweaksBetween(style, rules)).toEqual(changed ? [key] : []);
      const shared = parseSetupParams(setupParams({ styleId: style.id, rules }));
      expect(shared.ignored).toEqual([]);
      expect(tweaksBetween(style, shared.rules)).toEqual(tweaksBetween(style, rules));
      expect(sameRule(key, shared.rules[key], rules[key])).toBe(true);
      playGame(rules, 11, 30);
    });
  },
);
