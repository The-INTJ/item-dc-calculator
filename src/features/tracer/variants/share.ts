/**
 * Setup links: a game style plus only the rules changed from it, as readable
 * query parameters — `/tracer?style=v2-tiered&king=every-chart&dodge=0` — so
 * friends can send each other variants. The lobby also remembers the last
 * setup in this format.
 *
 * Reading is forgiving: an unknown style or an unreadable value is reported
 * in `ignored` and skipped, never fatal.
 */

import type { RuleSet } from '../engine';
import { DEFAULT_STYLE_ID, styleById, type GameStyle } from './profiles';
import { RuleSetSchema } from './rule-schema';
import { TOGGLE_KEYS, TOGGLES, withRule, type Toggle } from './toggles';
import { tweaksBetween } from './tweaks';

export const STYLE_PARAM = 'style';

export interface GameSetup {
  styleId: string;
  rules: RuleSet;
}

export interface ParsedSetup extends GameSetup {
  /** `name=value` pairs that could not be used. */
  ignored: string[];
}

function defaultStyle(): GameStyle {
  return styleById(DEFAULT_STYLE_ID) as GameStyle;
}

export function setupParams({ styleId, rules }: GameSetup): URLSearchParams {
  const style = styleById(styleId) ?? defaultStyle();
  const params = new URLSearchParams({ [STYLE_PARAM]: style.id });
  for (const key of tweaksBetween(style, rules)) params.set(TOGGLES[key].param, encodeRule(key, rules));
  return params;
}

function encodeRule<K extends keyof RuleSet>(key: K, rules: RuleSet): string {
  const toggle: Toggle<K> = TOGGLES[key];
  return toggle.encode(rules[key]);
}

function decodeRule<K extends keyof RuleSet>(key: K, text: string, rules: RuleSet): RuleSet | null {
  const toggle: Toggle<K> = TOGGLES[key];
  const value = toggle.decode(text, rules);
  return value === null ? null : withRule(rules, key, value);
}

export function parseSetupParams(params: URLSearchParams): ParsedSetup {
  const requested = params.get(STYLE_PARAM);
  const style = (requested !== null ? styleById(requested) : null) ?? defaultStyle();
  const ignored = requested !== null && style.id !== requested ? [`${STYLE_PARAM}=${requested}`] : [];
  let rules = style.rules;
  for (const key of TOGGLE_KEYS) {
    const text = params.get(TOGGLES[key].param);
    if (text === null) continue;
    const next = decodeRule(key, text, rules);
    if (next && RuleSetSchema.safeParse(next).success) rules = next;
    else ignored.push(`${TOGGLES[key].param}=${text}`);
  }
  return { styleId: style.id, rules, ignored };
}

/** Whether `params` say anything about a setup at all. */
export function hasSetupParams(params: URLSearchParams): boolean {
  return params.has(STYLE_PARAM) || TOGGLE_KEYS.some((key) => params.has(TOGGLES[key].param));
}
