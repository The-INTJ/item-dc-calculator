// @vitest-environment node
/**
 * Property test: seeded random self-play under the test rules. Every game
 * must keep the engine's invariants, survive a JSON round-trip with
 * Firestore-safe data, replay deterministically from its own records, and
 * shrug off garbage input. (variants/profiles.test.ts runs the same harness
 * for every game style.)
 */

import { describe, expect, it } from 'vitest';

import type { TurnInput } from './types';
import { TEST_RULES } from './fixtures/rules';
import { assertInvariants, pick, playGame, seeded } from './fixtures/self-play';
import { initialState } from './setup';
import { applyTurn } from './turn';

describe('random self-play', () => {
  it('keeps every invariant and replays deterministically', () => {
    const endings = new Set<string>();
    for (let seed = 1; seed <= 100; seed += 1) {
      const { state } = playGame(TEST_RULES, seed, 100);
      endings.add(state.result.status === 'won' ? state.result.reason : state.result.status);
    }
    expect(endings.has('king-capture')).toBe(true);
  }, 60_000);

  it('rejects garbage without throwing', () => {
    const rng = seeded(99);
    const state = initialState(TEST_RULES);
    const junk = () => pick(rng, ['', 'z9', 'd2', 'b1', '8', '55', '9'.repeat(70), '\u0000', 'R:8']);
    for (let i = 0; i < 2_000; i += 1) {
      const input = {
        ply: pick(rng, [0, 1, -1, 0.5, NaN]),
        main: pick(rng, [
          { kind: 'move', from: junk(), to: junk() },
          { kind: 'chart', from: junk(), steps: junk() },
          { kind: 'pass' },
          { kind: 'warp' },
          null,
        ]),
        freeStep: pick(rng, [null, { to: junk(), when: 'before' }, { to: junk(), when: 'later' }]),
      };
      const outcome = applyTurn(state, 'w', input as TurnInput);
      if (outcome.ok) assertInvariants(outcome.state);
    }
  });
});
