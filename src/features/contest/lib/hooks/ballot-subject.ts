'use client';

import { getEffectiveConfig } from '../domain/validation';
import { getEntriesInMatchup } from '../domain/matchupGetters';
import { buildEntrySummaries } from '../presentation/uiMappings';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';

/**
 * What this voter is scoring: the categories, the entries, and which entry (if
 * any) is their own. Re-derived on every render from the live contest and
 * matchup, so an admin editing either shows up immediately.
 */
export function deriveBallotSubject(
  contest: Contest | null,
  matchup: Matchup | null,
  userId: string | undefined,
) {
  const config = contest ? getEffectiveConfig(contest) : undefined;
  const categories = config?.attributes ?? [];
  const categoryIds = categories.map((a) => a.id);
  const entries = matchup ? getEntriesInMatchup(matchup) : [];
  const contestantsById = new Map(
    (contest?.contestants ?? []).map((c) => [c.id, c]),
  );
  const drinks = buildEntrySummaries(entries, contestantsById);
  const myContestantId = userId
    ? contest?.contestants.find((c) => c.userId === userId)?.id ?? null
    : null;
  const selfEntryId = myContestantId
    ? entries.find((e) => e.contestantId === myContestantId)?.id ?? null
    : null;

  return {
    config,
    categories,
    categoryIds,
    entries,
    drinks,
    selfEntryId,
    categoryKey: categoryIds.join('|'),
    entryKey: entries.map((entry) => entry.id).join('|'),
    matchupId: matchup?.id ?? null,
    // The matchup prop is re-derived from the live realtime subscription, so
    // this flips the moment an admin closes (or reopens) the matchup.
    isMatchupOpen: matchup?.phase === 'shake',
  };
}

export type BallotSubject = ReturnType<typeof deriveBallotSubject>;
