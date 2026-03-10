'use client';

import { useContestStore } from '@/contest/contexts/contest/ContestContext';
import { useContestSubscription } from './useContestSubscription';

export type ResolvedContestStatus = 'loading' | 'ready' | 'missing';

export function useResolvedContest(contestId: string | null) {
  const { contests, loading } = useContestStore();

  useContestSubscription(contestId);

  const contest = contestId
    ? contests.find((item) => item.id === contestId || item.slug === contestId) ?? null
    : null;

  const status: ResolvedContestStatus = loading
    ? 'loading'
    : contest
      ? 'ready'
      : 'missing';

  return { contest, status };
}
