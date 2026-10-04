/**
 * Test support: frozen rule sets for engine tests.
 *
 * Deliberately NOT imported from the variants catalogue — editing or adding a
 * game style must never break an engine scenario test. TEST_RULES is the
 * tiered game as first built: classic layout, 3/5/8-step Tracers, the king
 * keeping each Tracer's last pattern, free steps with Tracer or Warden moves,
 * and six free steps in a row (threatened or not) to draw.
 */

import type { Placement, RuleSet } from '../types';

const tracer = (id: string, file: string, tier: number): Placement => ({ id, kind: 'tracer', file, row: 0, tier });
const warden = (id: string, file: string): Placement => ({ id, kind: 'warden', file, row: 1, tier: null });

export const TEST_CLASSIC_LAYOUT: RuleSet['layout'] = {
  id: 'test-classic',
  name: 'Test classic',
  pieces: [
    { id: 'K', kind: 'king', file: 'e', row: 0, tier: null },
    tracer('T3', 'b', 0),
    tracer('T8', 'd', 2),
    tracer('T5', 'g', 1),
    warden('W1', 'b'),
    warden('W2', 'd'),
    warden('W3', 'e'),
    warden('W4', 'g'),
  ],
};

export const TEST_RULES: RuleSet = {
  layout: TEST_CLASSIC_LAYOUT,
  tracerReach: { limited: true, limits: [3, 5, 8] },
  kingMemory: 'current-kept',
  freeStep: 'with-tracer-or-warden',
  loneKingWins: true,
  dodgeDraw: 6,
  dodgeNeedsThreat: false,
};

export function rulesWith(patch: Partial<RuleSet>): RuleSet {
  return { ...TEST_RULES, ...patch };
}
