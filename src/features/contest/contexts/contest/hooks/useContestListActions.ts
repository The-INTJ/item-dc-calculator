import { useCallback } from 'react';
import type {
  Contest,
  ContestContextState,
  ContestContextStateUpdater,
} from '../contestTypes';
import { contestApi } from '../../../lib/api/contestApi';

/**
 * Actions on the contest collection itself: lookup, local replace/patch, and
 * create/delete against the API. `getContestById` and `replaceContest` are
 * also consumed by the round actions, which read-modify-write `contest.rounds`.
 */
export function useContestListActions(
  state: ContestContextState,
  updateState: (updater: ContestContextStateUpdater) => void,
) {
  const getContestById = useCallback(
    (id: string) => state.contests.find((c) => c.id === id),
    [state.contests],
  );

  const replaceContest = useCallback((contest: Contest) => {
    updateState((prev) => {
      const contests = prev.contests.map((c) => (c.id === contest.id ? contest : c));
      return { ...prev, contests };
    });
  }, [updateState]);

  const updateContest = useCallback((contestId: string, updates: Partial<Contest>) => {
    updateState((prev) => ({
      ...prev,
      contests: prev.contests.map((c) => (c.id === contestId ? { ...c, ...updates } : c)),
    }));
  }, [updateState]);

  const upsertContest = useCallback((contest: Contest) => {
    updateState((prev) => {
      const exists = prev.contests.some((c) => c.id === contest.id);
      const contests = exists
        ? prev.contests.map((c) => (c.id === contest.id ? contest : c))
        : [...prev.contests, contest];
      return { ...prev, contests };
    });
  }, [updateState]);

  const addContest = useCallback(async (name: string): Promise<Contest | null> => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const result = await contestApi.createContest({
      name: trimmedName,
      slug: trimmedName.toLowerCase().replace(/\s+/g, '-'),
    });

    if (result.success && result.data) {
      replaceContest(result.data);
      return result.data;
    }
    return null;
  }, [replaceContest]);

  const deleteContest = useCallback(async (contestId: string): Promise<boolean> => {
    const result = await contestApi.deleteContest(contestId);
    if (result.success) {
      updateState((prev) => {
        const contests = prev.contests.filter((c) => c.id !== contestId);
        const { [contestId]: _, ...remainingMatchups } = prev.matchupsByContestId;
        return { ...prev, contests, matchupsByContestId: remainingMatchups };
      });
    }
    return result.success;
  }, [updateState]);

  return { getContestById, replaceContest, updateContest, upsertContest, addContest, deleteContest };
}
