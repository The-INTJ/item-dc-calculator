import { useCallback } from 'react';
import type { Contest, ContestPhase, ContestRound, Entry } from '../contestTypes';
import { contestApi } from '../../../lib/api/contestApi';
import type { ContestState, ContestStateUpdater, ContestActions } from '../types';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * useContestActions
 * 
 * Provides all contest mutation actions. These actions call the API
 * and update local state optimistically or on success.
 */
export function useContestActions(
  state: ContestState,
  updateState: (updater: ContestStateUpdater) => void
): ContestActions {
  const getContestById = useCallback(
    (id: string) => state.contests.find((c) => c.id === id),
    [state.contests]
  );

  const replaceContest = useCallback((contest: Contest) => {
    updateState((prev) => {
      const contests = prev.contests.map((c) => c.id === contest.id ? contest : c);
      const activeContestId = contest.defaultContest ? contest.id : prev.activeContestId;
      return { ...prev, contests, activeContestId };
    });
  }, [updateState]);

  const setActiveContest = useCallback((contestId: string) => {
    updateState((prev) => ({
      ...prev,
      activeContestId: contestId,
      contests: prev.contests.map((c) => ({ ...c, defaultContest: c.id === contestId })),
    }));
  }, [updateState]);

  const updateContest = useCallback((contestId: string, updates: Partial<Contest>) => {
    updateState((prev) => ({
      ...prev,
      contests: prev.contests.map((c) => c.id === contestId ? { ...c, ...updates } : c),
    }));
  }, [updateState]);

  const upsertContest = useCallback((contest: Contest) => {
    updateState((prev) => {
      const exists = prev.contests.some((c) => c.id === contest.id);
      const contests = exists
        ? prev.contests.map((c) => c.id === contest.id ? contest : c)
        : [...prev.contests, contest];
      return { ...prev, contests, activeContestId: contest.defaultContest ? contest.id : prev.activeContestId };
    });
  }, [updateState]);

  const addContest = useCallback(async (name: string): Promise<Contest | null> => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const contest = await contestApi.createContest({
      name: trimmedName,
      slug: trimmedName.toLowerCase().replace(/\s+/g, '-'),
      phase: 'set',
    });

    if (contest) replaceContest(contest);
    return contest;
  }, [replaceContest]);

  const deleteContest = useCallback(async (contestId: string): Promise<boolean> => {
    const success = await contestApi.deleteContest(contestId);
    if (success) {
      updateState((prev) => {
        const contests = prev.contests.filter((c) => c.id !== contestId);
        const activeContestId = prev.activeContestId === contestId
          ? contests.find((c) => c.defaultContest)?.id ?? contests[0]?.id ?? null
          : prev.activeContestId;
        return { ...prev, contests, activeContestId };
      });
    }
    return success;
  }, [updateState]);

  const addRound = useCallback(async (contestId: string): Promise<boolean> => {
    const contest = getContestById(contestId);
    if (!contest) return false;

    const rounds = contest.rounds ?? [];
    const newRound: ContestRound = {
      id: generateId('round'),
      name: `Round ${rounds.length + 1}`,
      number: rounds.length + 1,
      state: 'set',
    };

    const updated = await contestApi.updateContest(contestId, { rounds: [...rounds, newRound] });
    if (updated) replaceContest(updated);
    return updated !== null;
  }, [getContestById, replaceContest]);

  const updateRound = useCallback(async (contestId: string, roundId: string, updates: Partial<ContestRound>): Promise<boolean> => {
    const contest = getContestById(contestId);
    if (!contest) return false;

    const rounds = (contest.rounds ?? []).map((r) => r.id === roundId ? { ...r, ...updates } : r);
    const updated = await contestApi.updateContest(contestId, { rounds });
    if (updated) replaceContest(updated);
    return updated !== null;
  }, [getContestById, replaceContest]);

  const removeRound = useCallback(async (contestId: string, roundId: string): Promise<boolean> => {
    const contest = getContestById(contestId);
    if (!contest) return false;

    const rounds = (contest.rounds ?? [])
      .filter((r) => r.id !== roundId)
      .map((r, i) => ({ ...r, name: `Round ${i + 1}`, number: i + 1 }));
    const entries = contest.entries?.map((e) => e.round === roundId ? { ...e, round: '' } : e);

    const updated = await contestApi.updateContest(contestId, { rounds, entries });
    if (updated) replaceContest(updated);
    return updated !== null;
  }, [getContestById, replaceContest]);

  const setActiveRound = useCallback(async (contestId: string, roundId: string): Promise<boolean> => {
    const updated = await contestApi.updateContest(contestId, { activeRoundId: roundId });
    if (updated) replaceContest(updated);
    return updated !== null;
  }, [replaceContest]);

  const setRoundState = useCallback(async (contestId: string, roundId: string, newState: ContestPhase): Promise<boolean> => {
    const contest = getContestById(contestId);
    if (!contest) return false;

    const rounds = (contest.rounds ?? []).map((r) => r.id === roundId ? { ...r, state: newState } : r);
    const updated = await contestApi.updateContest(contestId, { rounds });
    if (updated) replaceContest(updated);
    return updated !== null;
  }, [getContestById, replaceContest]);

  const addMixologist = useCallback(async (
    contestId: string,
    mixologist: { name: string; drinkName: string; roundId: string }
  ): Promise<Entry | null> => {
    const entry = await contestApi.createEntry(contestId, {
      name: mixologist.drinkName,
      slug: mixologist.drinkName.toLowerCase().replace(/\s+/g, '-'),
      description: '',
      round: mixologist.roundId,
      submittedBy: mixologist.name,
    });

    if (entry) {
      updateState((prev) => ({
        ...prev,
        contests: prev.contests.map((c) =>
          c.id === contestId ? { ...c, entries: [...(c.entries ?? []), entry] } : c
        ),
      }));
    }
    return entry;
  }, [updateState]);

  const updateMixologist = useCallback(async (contestId: string, drinkId: string, updates: Partial<Entry>): Promise<Entry | null> => {
    const entry = await contestApi.updateEntry(contestId, drinkId, updates);
    if (entry) {
      updateState((prev) => ({
        ...prev,
        contests: prev.contests.map((c) =>
          c.id === contestId
            ? { ...c, entries: c.entries?.map((e) => e.id === drinkId ? entry : e) }
            : c
        ),
      }));
    }
    return entry;
  }, [updateState]);

  const removeMixologist = useCallback(async (contestId: string, drinkId: string): Promise<boolean> => {
    const success = await contestApi.deleteEntry(contestId, drinkId);
    if (success) {
      updateState((prev) => ({
        ...prev,
        contests: prev.contests.map((c) =>
          c.id === contestId ? { ...c, entries: c.entries?.filter((e) => e.id !== drinkId) } : c
        ),
      }));
    }
    return success;
  }, [updateState]);

  return {
    setActiveContest,
    updateContest,
    upsertContest,
    addContest,
    deleteContest,
    addRound,
    updateRound,
    removeRound,
    setActiveRound,
    setRoundState,
    addMixologist,
    updateMixologist,
    removeMixologist,
  };
}
