/**
 * Replaying recorded turns. A TurnRecord carries everything needed to play
 * the same turn again, so a whole game can be rebuilt from its records —
 * used for undo in local games and to prove determinism in tests.
 */

import type { GameState, MainAction, RuleSet, TurnInput, TurnRecord } from './types';
import { initialState } from './setup';
import { applyTurn } from './turn';

/** The input that produced `record`, or null if the record is malformed. */
export function turnInputFromRecord(record: TurnRecord): TurnInput | null {
  const mainIndex = record.actions.findIndex((action) => action.kind !== 'step');
  const main = record.actions[mainIndex];
  if (!main || main.kind === 'step') return null;
  const stepIndex = record.actions.findIndex((action) => action.kind === 'step');
  const step = record.actions[stepIndex];
  let action: MainAction;
  if (main.kind === 'chart') action = { kind: 'chart', from: main.from, steps: main.steps };
  else if (main.kind === 'pass') action = { kind: 'pass' };
  else action = { kind: 'move', from: main.from, to: main.to };
  const freeStep =
    step?.kind === 'step' ? { to: step.to, when: stepIndex < mainIndex ? ('before' as const) : ('after' as const) } : null;
  return { ply: record.ply, main: action, freeStep };
}

/** The position after replaying `turns` under `rules` from the opening, or null if any fails. */
export function replayTurns(rules: RuleSet, turns: readonly TurnRecord[]): GameState | null {
  let state = initialState(rules);
  for (const record of turns) {
    const input = turnInputFromRecord(record);
    if (!input) return null;
    const outcome = applyTurn(state, record.side, input);
    if (!outcome.ok) return null;
    state = outcome.state;
  }
  return state;
}
