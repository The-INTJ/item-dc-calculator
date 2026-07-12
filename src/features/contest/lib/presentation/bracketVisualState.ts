/**
 * Pure visual-state matrix for bracket matchup cards and round columns.
 * Extracted from DisplayBracket's inline conditionals so every combination
 * is unit-testable.
 */

import type { RoundStatus } from '../../contexts/contest/contestTypes';
import type { DisplayMatchup, DisplayRound } from './displayModel';

export type MatchupVisualState = 'live' | 'scored' | 'bye' | 'tbd' | 'set';

/**
 * Visual treatment for one bracket card:
 * - 'bye'   — single-entry auto-advance; never pulses, even in an active round
 * - 'tbd'   — placeholder slot with no stored matchup behind it
 * - 'live'  — open for scoring in the active round (pulse animation)
 * - 'scored'— decided
 * - 'set'   — assigned but not yet open
 */
export function getMatchupVisualState(
  matchup: Pick<DisplayMatchup, 'isBye' | 'phase' | 'matchupId'>,
  roundIsActive: boolean,
): MatchupVisualState {
  if (matchup.isBye) return 'bye';
  if (!matchup.matchupId) return 'tbd';
  if (roundIsActive && matchup.phase === 'shake') return 'live';
  if (matchup.phase === 'scored') return 'scored';
  return 'set';
}

/** Column header label per round state. */
export function getColumnHeaderLabel(
  round: Pick<DisplayRound, 'isActive' | 'status'>,
): string {
  if (round.isActive) return 'Now Playing';
  if (round.status === 'closed') return 'Complete';
  return 'Round';
}

/** Column emphasis modifier per round status. */
export type ColumnEmphasis = RoundStatus;

export function getColumnEmphasis(round: Pick<DisplayRound, 'status'>): ColumnEmphasis {
  return round.status;
}
