import { useCallback, useRef } from 'react';
import type {
  Contest,
  Contestant,
  ContestActions,
  ContestContextState,
  ContestContextStateUpdater,
  ContestRound,
  Matchup,
} from '../contestTypes';
import { contestApi } from '../../../lib/api/contestApi';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Provides all contest + matchup mutation actions. Each action calls the API
 * and then reconciles local state (either a full-contest replace or a
 * per-matchup patch in `matchupsByContestId`).
 */
export function useContestActions(
  state: ContestContextState,
  updateState: (updater: ContestContextStateUpdater) => void,
): ContestActions {
  const getContestById = useCallback(
    (id: string) => state.contests.find((c) => c.id === id),
    [state.contests],
  );

  // Per-contest serialization for read-modify-write actions on `contest.rounds`.
  // Without this, rapid clicks on "Add round" all read the same stale rounds
  // array and overwrite each other's PUT (the API replaces the whole array).
  const roundMutationQueues = useRef<Map<string, Promise<unknown>>>(new Map());
  const enqueueRoundMutation = useCallback(
    <T,>(contestId: string, task: () => Promise<T>): Promise<T> => {
      const previous = roundMutationQueues.current.get(contestId) ?? Promise.resolve();
      const next = previous.then(task, task);
      roundMutationQueues.current.set(
        contestId,
        next.catch(() => undefined),
      );
      return next;
    },
    [],
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

  const addRound = useCallback(
    (contestId: string): Promise<boolean> =>
      enqueueRoundMutation(contestId, async () => {
        // Re-read the latest contest *inside* the queued task, after any prior
        // append has settled — otherwise concurrent clicks all snapshot the
        // pre-append rounds and clobber each other.
        const latest = await contestApi.getContest(contestId);
        const baseContest = latest.success && latest.data ? latest.data : getContestById(contestId);
        if (!baseContest) return false;

        const rounds = baseContest.rounds ?? [];
        const newRound: ContestRound = {
          id: generateId('round'),
          name: `Round ${rounds.length + 1}`,
          number: rounds.length + 1,
        };

        const result = await contestApi.updateContest(contestId, {
          rounds: [...rounds, newRound],
        });
        if (result.success && result.data) replaceContest(result.data);
        return result.success;
      }),
    [enqueueRoundMutation, getContestById, replaceContest],
  );

  const updateRound = useCallback(
    async (contestId: string, roundId: string, updates: Partial<ContestRound>): Promise<boolean> => {
      const result = await contestApi.updateRound(contestId, roundId, updates);
      if (result.success && result.data) replaceContest(result.data);
      return result.success;
    },
    [replaceContest],
  );

  const removeRound = useCallback(async (contestId: string, roundId: string): Promise<boolean> => {
    const contest = getContestById(contestId);
    if (!contest) return false;

    const rounds = (contest.rounds ?? [])
      .filter((r) => r.id !== roundId)
      .map((r, i) => ({ ...r, name: `Round ${i + 1}`, number: i + 1 }));

    const result = await contestApi.updateContest(contestId, { rounds });
    if (result.success && result.data) replaceContest(result.data);
    return result.success;
  }, [getContestById, replaceContest]);

  const setRoundOverride = useCallback(
    async (
      contestId: string,
      roundId: string,
      override: 'active' | 'closed' | null,
    ): Promise<boolean> => {
      const result = await contestApi.updateRound(contestId, roundId, { adminOverride: override });
      if (result.success && result.data) replaceContest(result.data);
      return result.success;
    },
    [replaceContest],
  );

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
    updateContest,
    upsertContest,
    addContest,
    deleteContest,
    addRound,
    updateRound,
    removeRound,
    setRoundOverride,
    addContestant,
    updateContestant,
    removeContestant,
    setMatchupsForContest,
    updateMatchup,
    setMatchupEntryName,
    seedRound,
    createMatchup,
    deleteMatchup,
  };
}
