import { useCallback } from 'react';
import type {
  ContestActions,
  ContestContextStateUpdater,
  Matchup,
} from '../contestTypes';
import { contestApi } from '../../../lib/api/contestApi';

/**
 * Matchup mutations, including round seeding. Each action calls the API and
 * then reconciles the per-contest matchup cache in `matchupsByContestId`.
 */
export function useMatchupActions(
  updateState: (updater: ContestContextStateUpdater) => void,
) {
  const setMatchupsForContest = useCallback(
    (contestId: string, matchups: Matchup[]) => {
      updateState((prev) => ({
        ...prev,
        matchupsByContestId: { ...prev.matchupsByContestId, [contestId]: matchups },
      }));
    },
    [updateState],
  );

  const upsertMatchup = useCallback(
    (contestId: string, matchup: Matchup) => {
      updateState((prev) => {
        const existing = prev.matchupsByContestId[contestId] ?? [];
        const next = existing.some((m) => m.id === matchup.id)
          ? existing.map((m) => (m.id === matchup.id ? matchup : m))
          : [...existing, matchup];
        return {
          ...prev,
          matchupsByContestId: { ...prev.matchupsByContestId, [contestId]: next },
        };
      });
    },
    [updateState],
  );

  const updateMatchup = useCallback(
    async (
      contestId: string,
      matchupId: string,
      updates: Partial<Matchup>,
    ): Promise<Matchup | null> => {
      const result = await contestApi.updateMatchup(contestId, matchupId, updates);
      if (result.success && result.data) {
        upsertMatchup(contestId, result.data);
        return result.data;
      }
      return null;
    },
    [upsertMatchup],
  );

  const seedRound = useCallback(
    async (
      contestId: string,
      roundId: string,
      pairs?: Array<[string, string] | [string]>,
    ): Promise<{ matchups: Matchup[] | null; error: string | null }> => {
      const body = pairs ? { entryIdPairs: pairs } : {};
      const result = await contestApi.seedRound(contestId, roundId, body);
      if (!result.success || !result.data) {
        return { matchups: null, error: result.error ?? 'Failed to seed round' };
      }

      updateState((prev) => {
        const existing = prev.matchupsByContestId[contestId] ?? [];
        const keepOtherRounds = existing.filter((m) => m.roundId !== roundId);
        return {
          ...prev,
          matchupsByContestId: {
            ...prev.matchupsByContestId,
            [contestId]: [...keepOtherRounds, ...result.data!.matchups],
          },
        };
      });
      return { matchups: result.data.matchups, error: null };
    },
    [updateState],
  );

  const createMatchup = useCallback<ContestActions['createMatchup']>(
    async (contestId, input) => {
      const result = await contestApi.createMatchup(contestId, {
        roundId: input.roundId,
        slotIndex: input.slotIndex,
        contestantIds: input.contestantIds,
        phase: input.phase ?? 'set',
        ...(input.winnerEntryId !== undefined ? { winnerEntryId: input.winnerEntryId } : {}),
      });
      if (!result.success || !result.data) return null;
      const created = result.data;
      updateState((prev) => {
        const existing = prev.matchupsByContestId[contestId] ?? [];
        return {
          ...prev,
          matchupsByContestId: {
            ...prev.matchupsByContestId,
            [contestId]: [...existing, created],
          },
        };
      });
      return created;
    },
    [updateState],
  );

  const setMatchupEntryName = useCallback<ContestActions['setMatchupEntryName']>(
    async (contestId, matchupId, entryId, payload) => {
      const result = await contestApi.setMatchupEntryName(contestId, matchupId, entryId, payload);
      if (!result.success || !result.data) return null;
      upsertMatchup(contestId, result.data);
      return result.data;
    },
    [upsertMatchup],
  );

  const deleteMatchup = useCallback<ContestActions['deleteMatchup']>(
    async (contestId, matchupId) => {
      const result = await contestApi.deleteMatchup(contestId, matchupId);
      if (!result.success) return false;
      updateState((prev) => {
        const existing = prev.matchupsByContestId[contestId] ?? [];
        return {
          ...prev,
          matchupsByContestId: {
            ...prev.matchupsByContestId,
            [contestId]: existing.filter((m) => m.id !== matchupId),
          },
        };
      });
      return true;
    },
    [updateState],
  );

  return {
    setMatchupsForContest,
    updateMatchup,
    setMatchupEntryName,
    seedRound,
    createMatchup,
    deleteMatchup,
  };
}
