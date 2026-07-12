/**
 * Single source of truth for deriving a matchup's winner from its score
 * aggregates. Replaces the three divergent copies that used to live in the
 * seed route (`healWinnerFromScores`), AdminContestRounds
 * (`getLeadingEntryId`), and ad-hoc display comparisons.
 *
 * Winner comparison uses RAW averages (sumScore / voteCount, no rounding) so
 * a 7.4-vs-6.6 matchup has a winner even though both display as 7. Display
 * rounding stays in `contestGetters.getEntryScore`.
 */

import type { Entry, Matchup } from '../../contexts/contest/contestTypes';

/** Tolerance for float comparison — averages are quotients of small sums. */
const EPSILON = 1e-9;

/** Raw (unrounded) average for an entry, or null when it has no votes. */
export function getEntryAverageRaw(entry: Entry): number | null {
  if (!entry.voteCount || entry.voteCount === 0) return null;
  return (entry.sumScore ?? 0) / entry.voteCount;
}

export type WinnerResolution =
  | { ok: true; winnerEntryId: string }
  | { ok: false; reason: 'no-entries' | 'no-scores' | 'tied' };

/**
 * Resolve the winner of a matchup from entry aggregates.
 *
 * - single entry (bye) → that entry wins
 * - no entry has votes → `no-scores`
 * - raw averages tie (within epsilon) → `tied`
 */
export function resolveMatchupWinner(matchup: Pick<Matchup, 'entries'>): WinnerResolution {
  const entries = matchup.entries ?? [];
  if (entries.length === 0) return { ok: false, reason: 'no-entries' };
  if (entries.length === 1) return { ok: true, winnerEntryId: entries[0].id };

  let leaderId: string | null = null;
  let leaderScore = Number.NEGATIVE_INFINITY;
  let tied = false;

  for (const entry of entries) {
    const score = getEntryAverageRaw(entry);
    if (score == null) continue;
    if (score > leaderScore + EPSILON) {
      leaderId = entry.id;
      leaderScore = score;
      tied = false;
    } else if (Math.abs(score - leaderScore) <= EPSILON) {
      tied = true;
    }
  }

  if (leaderId == null) return { ok: false, reason: 'no-scores' };
  if (tied) return { ok: false, reason: 'tied' };
  return { ok: true, winnerEntryId: leaderId };
}
