import type { BracketRound } from '../../components/ui/BracketView';

export type BracketLayoutKind = 'face-off' | 'bracket';

export interface BracketLayout {
  kind: BracketLayoutKind;
  rounds: BracketRound[];
  /** The single round used in face-off mode, or null for bracket mode */
  finalRound: BracketRound | null;
}

/**
 * Determines the bracket layout strategy based on round count.
 * - 0-1 rounds: "face-off" — head-to-head final view
 * - 2+ rounds: "bracket" — standard left-to-right bracket grid
 */
export function buildBracketLayout(rounds: BracketRound[]): BracketLayout {
  if (rounds.length <= 1) {
    return {
      kind: 'face-off',
      rounds,
      finalRound: rounds[0] ?? null,
    };
  }

  return {
    kind: 'bracket',
    rounds,
    finalRound: null,
  };
}
