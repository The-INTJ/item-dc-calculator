/**
 * Pure planning logic for removing a contestant mid-contest (cascade
 * semantics — see the campaign decision):
 *
 * - their entries are removed from every matchup they appear in
 * - a 2-entry matchup collapses to a scored bye (the remaining entry
 *   auto-advances, matching seed-route bye semantics)
 * - a matchup left with zero entries is deleted outright
 * - winners are recomputed where the removed contestant had won
 * - votes cast ON their entries are purged (the entry no longer exists)
 * - votes cast BY them on other entries are KEPT — surviving entries'
 *   aggregates are untouched, and their Voter record stays
 *
 * The adapter executes this plan; keeping it pure makes the boundary
 * unit-testable without Firestore.
 */

import type { Entry, Matchup, MatchupPhase } from '../../contexts/contest/contestTypes';
import { resolveMatchupWinner } from './winnerResolution';

export interface ContestantRemovalPlan {
  /** Matchups whose entry list changes; full replacement payloads. */
  updates: Array<{
    matchupId: string;
    entries: Entry[];
    phase: MatchupPhase;
    winnerEntryId: string | null;
  }>;
  /** Matchups left with no entries at all — delete the documents. */
  deletes: string[];
  /** Entry ids whose vote documents should be purged. */
  purgedEntryIds: string[];
}

export function planContestantRemoval(
  contestantId: string,
  matchups: Matchup[],
): ContestantRemovalPlan {
  const updates: ContestantRemovalPlan['updates'] = [];
  const deletes: string[] = [];
  const purgedEntryIds: string[] = [];

  for (const matchup of matchups) {
    const entries = matchup.entries ?? [];
    const removed = entries.filter((e) => e.contestantId === contestantId);
    if (removed.length === 0) continue;

    purgedEntryIds.push(...removed.map((e) => e.id));
    const remaining = entries.filter((e) => e.contestantId !== contestantId);

    if (remaining.length === 0) {
      deletes.push(matchup.id);
      continue;
    }

    if (remaining.length === 1) {
      // Collapse to a scored bye — the remaining contestant auto-advances.
      updates.push({
        matchupId: matchup.id,
        entries: remaining,
        phase: 'scored',
        winnerEntryId: remaining[0].id,
      });
      continue;
    }

    // 3+ entries (future XvX): keep the phase; recompute the winner only if
    // the removed contestant held it.
    const winnerRemoved =
      matchup.winnerEntryId != null && removed.some((e) => e.id === matchup.winnerEntryId);
    let winnerEntryId = matchup.winnerEntryId ?? null;
    if (winnerRemoved) {
      const resolution = resolveMatchupWinner({ entries: remaining });
      winnerEntryId = resolution.ok ? resolution.winnerEntryId : null;
    }
    updates.push({
      matchupId: matchup.id,
      entries: remaining,
      phase: matchup.phase,
      winnerEntryId,
    });
  }

  return { updates, deletes, purgedEntryIds };
}
