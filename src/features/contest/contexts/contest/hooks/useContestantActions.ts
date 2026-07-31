import { useCallback } from 'react';
import type { Contestant, ContestContextStateUpdater } from '../contestTypes';
import { contestApi } from '../../../lib/api/contestApi';

/**
 * Contestant roster mutations. Each action calls the API and then patches the
 * owning contest's `contestants` array in local state.
 */
export function useContestantActions(
  updateState: (updater: ContestContextStateUpdater) => void,
) {
  const addContestant = useCallback(
    async (
      contestId: string,
      contestant: { displayName: string; userId?: string; contact?: string },
    ): Promise<Contestant | null> => {
      const result = await contestApi.createContestant(contestId, contestant);

      if (result.success && result.data) {
        const created = result.data;
        updateState((prev) => ({
          ...prev,
          contests: prev.contests.map((c) =>
            c.id === contestId ? { ...c, contestants: [...(c.contestants ?? []), created] } : c,
          ),
        }));
        return created;
      }
      return null;
    },
    [updateState],
  );

  const updateContestant = useCallback(
    async (
      contestId: string,
      contestantId: string,
      updates: Partial<Contestant>,
    ): Promise<Contestant | null> => {
      const result = await contestApi.updateContestant(contestId, contestantId, updates);
      if (result.success && result.data) {
        const updated = result.data;
        updateState((prev) => ({
          ...prev,
          contests: prev.contests.map((c) =>
            c.id === contestId
              ? {
                  ...c,
                  contestants: c.contestants?.map((cc) => (cc.id === contestantId ? updated : cc)),
                }
              : c,
          ),
        }));
        return updated;
      }
      return null;
    },
    [updateState],
  );

  const removeContestant = useCallback(
    async (contestId: string, contestantId: string): Promise<boolean> => {
      const result = await contestApi.deleteContestant(contestId, contestantId);
      if (result.success) {
        updateState((prev) => ({
          ...prev,
          contests: prev.contests.map((c) =>
            c.id === contestId
              ? { ...c, contestants: c.contestants?.filter((cc) => cc.id !== contestantId) }
              : c,
          ),
        }));
      }
      return result.success;
    },
    [updateState],
  );

  return { addContestant, updateContestant, removeContestant };
}
