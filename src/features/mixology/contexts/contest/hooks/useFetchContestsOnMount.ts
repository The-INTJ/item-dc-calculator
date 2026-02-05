import { useEffect, useRef } from 'react';
import { contestApi } from '../../../services/contestApi';
import type { ContestStateUpdater } from '../types';
import type { Contest } from '../../../types';

/**
 * useFetchContestsOnMount
 * 
 * Fetches all contests from the API when the component mounts.
 * Sets the active contest to the current/default contest.
 */
export function useFetchContestsOnMount(
  updateState: (updater: ContestStateUpdater) => void,
  onComplete?: () => void
): void {
  const hasFetched = useRef(false);

  useEffect(function fetchContestsOnMount() {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function load() {
      const result = await contestApi.listContests();
      if (result) {
        const { contests, currentContest } = result;
        updateState((prev) => ({
          ...prev,
          contests,
          activeContestId: currentContest?.id ?? contests.find((c: Contest) => c.defaultContest)?.id ?? contests[0]?.id ?? null,
          lastUpdatedAt: Date.now(),
        }));
      }
      onComplete?.();
    }

    void load();
  }, [updateState, onComplete]);
}
