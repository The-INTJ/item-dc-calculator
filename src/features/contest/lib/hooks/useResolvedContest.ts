'use client';

import { useContestStore } from '@/contest/contexts/contest/ContestContext';
import { useContestSubscription, useMatchupsSubscription } from '../realtime';
import type { Matchup } from '../../contexts/contest/contestTypes';

export type ResolvedContestStatus = 'loading' | 'ready' | 'missing';

export function useResolvedContest(contestId: string | null) {
  const { contests, matchupsByContestId, loading } = useContestStore();

  const contest = contestId
    ? contests.find((item) => item.id === contestId || item.slug === contestId) ?? null
    : null;

  useContestSubscription(contest?.id ?? null);
  useMatchupsSubscription(contest?.id ?? null);

  const matchups: Matchup[] = contest ? matchupsByContestId[contest.id] ?? [] : [];

  const status: ResolvedContestStatus = loading
    ? 'loading'
    : contest
      ? 'ready'
      : 'missing';

  return { contest, matchups, status };
}
