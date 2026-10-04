/**
 * A toggle is one adjustable rule: a lens on exactly ONE RuleSet field, with
 * everything the lobby, the in-game rules list and setup links need to show,
 * edit and share it. A toggle can only change its own field (writes go
 * through `withRule`), so the order toggles are applied in never matters.
 */

import type { RuleSet } from '../../engine';

export type ToggleGroup = 'Board' | 'Tracers' | 'King' | 'Turn' | 'Ending';

export interface SwitchControl {
  kind: 'switch';
}

/** A pick from fixed values. A Record, so a new value can't be left unlabelled. */
export interface ChoiceControl<V extends string> {
  kind: 'choice';
  options: Record<V, string>;
}

export interface NumberControl {
  kind: 'number';
  min: number;
  max: number;
  /** Shown instead of 0, e.g. "Off". */
  zeroLabel: string | null;
}

/** A bespoke control the lobby renders by id. */
export interface CustomControl {
  kind: 'custom';
  id: 'layout' | 'tracer-reach';
}

/** Any toggle's control, for code that renders whichever one it is given. */
export type AnyControl = SwitchControl | ChoiceControl<string> | NumberControl | CustomControl;

export type ControlFor<V> = [V] extends [boolean]
  ? SwitchControl
  : [V] extends [string]
    ? ChoiceControl<V>
    : [V] extends [number]
      ? NumberControl
      : CustomControl;

export interface Toggle<K extends keyof RuleSet> {
  key: K;
  group: ToggleGroup;
  label: string;
  /** One line under the control. */
  help: string;
  control: ControlFor<RuleSet[K]>;
  /** This rule in words, for the in-game rules list. */
  describe(value: RuleSet[K], rules: RuleSet): string;
  /** Why the toggle has no effect under the other rules, or null when it matters. */
  inert(rules: RuleSet): string | null;
  /** Whether two values play the same (defaults to structural equality). */
  same?(a: RuleSet[K], b: RuleSet[K]): boolean;
  /** Setup-link parameter: its name, and the value as readable text and back. */
  param: string;
  encode(value: RuleSet[K]): string;
  /** `rules` are the rules so far (the style's, plus earlier params); null = unreadable. */
  decode(text: string, rules: RuleSet): RuleSet[K] | null;
  /** Values the toggle tests try under every style. */
  samples: RuleSet[K][];
}

/** `rules` with one field replaced — the only way a toggle changes rules. */
export function withRule<K extends keyof RuleSet>(rules: RuleSet, key: K, value: RuleSet[K]): RuleSet {
  return { ...rules, [key]: value };
}
