'use client';

import { useEffect, useState } from 'react';
import type { Contest } from '../../contexts/contest/contestTypes';
import {
  setLastAdminContest,
  useLastAdminContest,
} from '../../lib/hooks/useLastAdminContest';

/**
 * Which contest the admin dashboard is showing. Opens on the one they were
 * last working in — admins live in a single contest for an evening — and
 * re-points at the freshest copy whenever the list refreshes underneath it.
 */
export function useSelectedAdminContest(contests: Contest[]) {
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const lastAdminContest = useLastAdminContest();

  useEffect(() => {
    if (selectedContest || contests.length === 0) return;
    const remembered = lastAdminContest
      ? contests.find((c) => c.id === lastAdminContest.id)
      : null;
    setSelectedContest(remembered ?? contests[0]);
  }, [contests, selectedContest, lastAdminContest]);

  useEffect(() => {
    if (!selectedContest) return;
    const latest = contests.find((contest) => contest.id === selectedContest.id);
    if (latest && latest !== selectedContest) {
      setSelectedContest(latest);
    }
  }, [contests, selectedContest]);

  const selectContest = (contest: Contest) => {
    setSelectedContest(contest);
    setLastAdminContest({ id: contest.id, name: contest.name });
  };

  return { selectedContest, setSelectedContest, selectContest };
}
