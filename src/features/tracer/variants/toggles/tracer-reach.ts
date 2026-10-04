import { MAX_PATH_LENGTH, type Layout, type RuleSet } from '../../engine';
import { MAX_TIERS } from '../rule-schema';
import type { Toggle } from './types';

type Reach = RuleSet['tracerReach'];

/** The layout's Tracers by tier, shortest first, with their starting squares — how the lobby labels each limit. */
export function tierSquares(layout: Layout): { tier: number; squares: string[] }[] {
  const tiers = new Map<number, string[]>();
  for (const p of layout.pieces) {
    if (p.kind === 'tracer' && p.tier !== null) tiers.set(p.tier, [...(tiers.get(p.tier) ?? []), `${p.file}${1 + p.row}`]);
  }
  return [...tiers.entries()].sort(([a], [b]) => a - b).map(([tier, squares]) => ({ tier, squares }));
}

function describe(reach: Reach, rules: RuleSet): string {
  if (!reach.limited) return 'Tracers chart paths of any length.';
  const parts = tierSquares(rules.layout).map(({ tier, squares }) => {
    const limit = reach.limits[tier] ?? null;
    return `${squares.join(', ')}: ${limit === null ? 'any length' : `up to ${limit}`}`;
  });
  return `Tracers chart limited paths — ${parts.join('; ')}.`;
}

function decode(text: string, rules: RuleSet): Reach | null {
  if (text === 'off') return { limited: false, limits: rules.tracerReach.limits };
  const parts = text.split('-');
  if (parts.length === 0 || parts.length > MAX_TIERS) return null;
  const limits = parts.map((part) => (part === 'x' ? null : /^\d{1,2}$/.test(part) ? Number(part) : NaN));
  if (limits.some((limit) => limit !== null && !(limit >= 1 && limit <= MAX_PATH_LENGTH))) return null;
  return { limited: true, limits };
}

export const TRACER_REACH_TOGGLE: Toggle<'tracerReach'> = {
  key: 'tracerReach',
  group: 'Tracers',
  label: 'Step limits',
  help: 'Cap how many squares each Tracer may chart in one go.',
  control: { kind: 'custom', id: 'tracer-reach' },
  describe,
  inert: (rules) => (rules.layout.pieces.some((p) => p.kind === 'tracer') ? null : 'This layout has no Tracers.'),
  same: (a, b) => (!a.limited && !b.limited) || (a.limited === b.limited && a.limits.join() === b.limits.join()),
  param: 'reach',
  encode: (reach) => (reach.limited ? reach.limits.map((limit) => limit ?? 'x').join('-') : 'off'),
  decode,
  samples: [
    { limited: false, limits: [3, 5, 8] },
    { limited: true, limits: [3, 5, 8] },
    { limited: true, limits: [1, 2, 3] },
    { limited: true, limits: [2, null, 6] },
  ],
};
