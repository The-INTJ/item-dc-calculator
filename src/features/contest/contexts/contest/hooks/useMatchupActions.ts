import { useCallback } from 'react';
import type {
  ContestActions,
  ContestContextStateUpdater,
  Matchup,
} from '../contestTypes';
import { contestApi } from '../../../lib/api/contestApi';
import { useMatchupCache } from './useMatchupCache';

type MatchupCreateArgs = Parameters<ContestActions['createMatchup']>[1];

/** The API's create shape: phase defaults to 'set', winner omitted unless given. */
function toCreatePayload(input: MatchupCreateArgs) {
  return {
    roundId: input.roundId,
    slotIndex: input.slotIndex,
    contestantIds: input.contestantIds,
    phase: input.phase ?? 'set',
    ...(input.winnerEntryId !== undefined ? { winnerEntryId: input.winnerEntryId } : {}),
  };
}

/**
 * Matchup mutations, including round seeding. Each action calls the API and
 * then reconciles the per-contest matchup cache in `matchupsByContestId`.
 */
export function useMatchupActions(
  updateState: (updater: ContestContextStateUpdater) => void,
) {
  const {
    setMatchupsForContest,
    upsertMatchup,
    appendMatchup,
    removeMatchup,
    replaceRoundMatchups,
  } = useMatchupCache(updateState);

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

      replaceRoundMatchups(contestId, roundId, result.data.matchups);
      return { matchups: result.data.matchups, error: null };
    },
    [replaceRoundMatchups],
  );

  const createMatchup = useCallback<ContestActions['createMatchup']>(
    async (contestId, input) => {
      const result = await contestApi.createMatchup(contestId, toCreatePayload(input));
      if (!result.success || !result.data) return null;
      appendMatchup(contestId, result.data);
      return result.data;
    },
    [appendMatchup],
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
      removeMatchup(contestId, matchupId);
      return true;
    },
    [removeMatchup],
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
