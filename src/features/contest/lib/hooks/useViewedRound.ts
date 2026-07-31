'use client';

import { useMemo, useState } from 'react';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';
import { getActiveRoundIdFromMatchups } from '../domain/matchupGetters';
import { buildBracketRoundsFromContest } from '../presentation/buildBracketRoundsFromContest';

/**
 * Which round the bracket is showing. Follows the live round by default, and
 * stays wherever the viewer navigated — until that round disappears from the
 * bracket, at which point it falls back to live rather than showing nothing.
 */
export function useViewedRound(contest: Contest, matchups: Matchup[]) {
  const rounds = useMemo(
    () => buildBracketRoundsFromContest(contest, matchups),
    [contest, matchups],
  );
  const activeRoundId = useMemo(
    () => getActiveRoundIdFromMatchups(contest.rounds ?? [], matchups),
    [contest.rounds, matchups],
  );
  const fallbackRoundId = activeRoundId ?? rounds[0]?.id ?? null;

  const [userPickedRoundId, setUserPickedRoundId] = useState<string | null>(null);

  const viewedRoundId =
    userPickedRoundId && rounds.some((r) => r.id === userPickedRoundId)
      ? userPickedRoundId
      : fallbackRoundId;

  return { rounds, activeRoundId, viewedRoundId, viewRound: setUserPickedRoundId };
}
