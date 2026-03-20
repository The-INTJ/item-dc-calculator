'use client';

import { useContestStore } from '@/contest/contexts/contest/ContestContext';
import { useContestSubscription } from '../realtime';

export type ResolvedContestStatus = 'loading' | 'ready' | 'missing';

export function useResolvedContest(contestId: string | null) {
  const { contests, loading } = useContestStore();

  const contest = contestId
    ? contests.find((item) => item.id === contestId || item.slug === contestId) ?? null
    : null;

  useContestSubscription(contest?.id ?? null);

  const status: ResolvedContestStatus = loading
    ? 'loading'
    : contest
      ? 'ready'
      : 'missing';

  return { contest, status };
}
