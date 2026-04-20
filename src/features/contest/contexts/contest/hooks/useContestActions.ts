import { useCallback } from 'react';
import type {
  Contest,
  ContestActions,
  ContestContextState,
  ContestContextStateUpdater,
  ContestRound,
  Entry,
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

  const addRound = useCallback(async (contestId: string): Promise<boolean> => {
    const contest = getContestById(contestId);
    if (!contest) return false;

    const rounds = contest.rounds ?? [];
    const newRound: ContestRound = {
      id: generateId('round'),
      name: `Round ${rounds.length + 1}`,
      number: rounds.length + 1,
    };

    const result = await contestApi.updateContest(contestId, { rounds: [...rounds, newRound] });
    if (result.success && result.data) replaceContest(result.data);
    return result.success;
  }, [getContestById, replaceContest]);

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
      contestant: { name: string; entryName: string },
    ): Promise<Entry | null> => {
      const result = await contestApi.createEntry(contestId, {
        name: contestant.entryName,
        slug: contestant.entryName.toLowerCase().replace(/\s+/g, '-'),
        description: '',
        submittedBy: contestant.name,
      });

      if (result.success && result.data) {
        const entry = result.data;
        updateState((prev) => ({
          ...prev,
          contests: prev.contests.map((c) =>
            c.id === contestId ? { ...c, entries: [...(c.entries ?? []), entry] } : c,
          ),
        }));
        return entry;
      }
      return null;
    },
    [updateState],
  );

  const updateContestant = useCallback(
    async (contestId: string, entryId: string, updates: Partial<Entry>): Promise<Entry | null> => {
      const result = await contestApi.updateEntry(contestId, entryId, updates);
      if (result.success && result.data) {
        const entry = result.data;
        updateState((prev) => ({
          ...prev,
          contests: prev.contests.map((c) =>
            c.id === contestId
              ? { ...c, entries: c.entries?.map((e) => (e.id === entryId ? entry : e)) }
              : c,
          ),
        }));
        return entry;
      }
      return null;
    },
    [updateState],
  );

  const removeContestant = useCallback(async (contestId: string, entryId: string): Promise<boolean> => {
    const result = await contestApi.deleteEntry(contestId, entryId);
    if (result.success) {
      updateState((prev) => ({
        ...prev,
        contests: prev.contests.map((c) =>
          c.id === contestId ? { ...c, entries: c.entries?.filter((e) => e.id !== entryId) } : c,
        ),
      }));
    }
    return result.success;
  }, [updateState]);

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
      pairs?: Array<[string, string]>,
    ): Promise<Matchup[] | null> => {
      const body = pairs ? { entryIdPairs: pairs } : {};
      const result = await contestApi.seedRound(contestId, roundId, body);
      if (!result.success || !result.data) return null;

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
      return result.data.matchups;
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
    seedRound,
  };
}
