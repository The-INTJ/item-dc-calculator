'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Contest, ContestPhase, ContestRound, Entry } from '../types';
import { buildDefaultVoteCategories } from '../components/ui/voteUtils';
import { getActiveRoundId, getRoundById, getRoundLabel } from '../lib/contestHelpers';
import { useContestState } from './ContestStateContext';
import { adminApi } from '../services/adminApi';

interface AdminContestState {
  contests: Contest[];
  activeContestId: string | null;
  lastUpdatedAt: number | null;
}

interface AdminContestContextValue extends AdminContestState {
  setActiveContest: (contestId: string) => void;
  updateContest: (contestId: string, updates: Partial<Contest>) => void;
  upsertContest: (contest: Contest) => void;
  addContest: (name: string) => void;
  deleteContest: (contestId: string) => Promise<{ success: boolean; error?: string }>;
  addRound: (contestId: string) => Promise<{ success: boolean; error?: string }>;
  updateRound: (contestId: string, roundId: string, updates: Partial<ContestRound>) => Promise<{ success: boolean; error?: string }>;
  removeRound: (contestId: string, roundId: string) => Promise<{ success: boolean; error?: string }>;
  setActiveRound: (contestId: string, roundId: string) => Promise<{ success: boolean; error?: string }>;
  setRoundState: (contestId: string, roundId: string, state: ContestPhase) => Promise<{ success: boolean; error?: string }>;
  addMixologist: (contestId: string, mixologist: { name: string; drinkName: string; roundId: string }) => Promise<{ success: boolean; data?: Entry; error?: string }>;
  updateMixologist: (contestId: string, drinkId: string, updates: Partial<Entry>) => Promise<{ success: boolean; data?: Entry; error?: string }>;
  removeMixologist: (contestId: string, drinkId: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => void;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeContest(contest: Contest): Contest {
  const rounds = (contest.rounds ?? []).map((round) => ({
    ...round,
    state: round.state ?? 'set',
  })) as ContestRound[];
  const activeRoundId = getActiveRoundId({ ...contest, rounds });
  const activeRound = getRoundById({ ...contest, rounds }, activeRoundId);
  const bracketRound = getRoundLabel({ ...contest, rounds }, activeRoundId);
  // Sync contest phase to the active round's state
  const phase = activeRound?.state ?? contest.phase ?? 'set';

  return {
    ...contest,
    rounds,
    activeRoundId,
    bracketRound,
    phase,
  };
}

/**
 * Load initial state - cloud-only, no localStorage.
 * Returns empty state; data will be fetched from Firestore.
 */
function loadState(): AdminContestState {
  return { contests: [], activeContestId: null, lastUpdatedAt: null };
}

const AdminContestContext = createContext<AdminContestContextValue | undefined>(undefined);

export function AdminContestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminContestState>(() => loadState());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { setState: setGlobalState } = useContestState();

  // Fetch contests from the API on mount
  useEffect(() => {
    const fetchContests = async () => {
      try {
        const result = await adminApi.listContests();
        if (result.success && result.data) {
          const { contests: fetchedContests, currentContest } = result.data;
          setState((prev) => ({
            ...prev,
            contests: fetchedContests.map(normalizeContest),
            activeContestId: currentContest?.id ?? fetchedContests.find((c) => c.defaultContest)?.id ?? fetchedContests[0]?.id ?? null,
            lastUpdatedAt: Date.now(),
          }));
        }
      } catch (error) {
        console.error('Failed to fetch contests:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      void fetchContests();
    }
  }, [isInitialLoad]);

  // Sync active contest's phase to global ContestState whenever it changes
  useEffect(() => {
    const activeContest =
      state.contests.find((c) => c.id === state.activeContestId) ??
      state.contests.find((c) => c.defaultContest);
    if (activeContest) {
      setGlobalState(activeContest.phase);
    }
  }, [state, setGlobalState]);

  const updateState = useCallback((updater: (prev: AdminContestState) => AdminContestState) => {
    setState((prev) => {
      const next = updater(prev);
      return { ...next, lastUpdatedAt: Date.now() };
    });
  }, []);

  const updateContest = useCallback((contestId: string, updates: Partial<Contest>) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) {
          return updates.defaultContest ? { ...contest, defaultContest: false } : contest;
        }
        return normalizeContest({ ...contest, ...updates });
      });
      const activeContestId = updates.defaultContest ? contestId : prev.activeContestId;
      return { ...prev, contests, activeContestId };
    });
  }, [updateState]);

  const upsertContest = useCallback((contest: Contest) => {
    updateState((prev) => {
      const normalized = normalizeContest(contest);
      const contests = prev.contests.some((item) => item.id === contest.id)
        ? prev.contests.map((item) => {
            if (item.id !== contest.id) {
              return normalized.defaultContest ? { ...item, defaultContest: false } : item;
            }
            return normalized;
          })
        : [...prev.contests, normalized];
      const activeContestId = normalized.defaultContest ? normalized.id : prev.activeContestId;
      return { ...prev, contests, activeContestId };
    });
  }, [updateState]);

  const setActiveContest = useCallback((contestId: string) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => ({
        ...contest,
        defaultContest: contest.id === contestId,
      }));
      return { ...prev, contests, activeContestId: contestId };
    });
  }, [updateState]);

  const addRound = useCallback(async (contestId: string): Promise<{ success: boolean; error?: string }> => {
    // Find the contest to calculate the next round number
    const contest = state.contests.find((c) => c.id === contestId);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }
    
    const existingRounds = contest.rounds ?? [];
    const roundNumber = existingRounds.length + 1;
    const nextRound: ContestRound = {
      id: generateId('round'),
      name: `Round ${roundNumber}`,
      number: roundNumber,
      state: 'set',
    };
    const newRounds = [...existingRounds, nextRound];
    
    // Optimistically update local state
    updateState((prev) => {
      const contests = prev.contests.map((c) => {
        if (c.id !== contestId) return c;
        return normalizeContest({
          ...c,
          rounds: newRounds,
        });
      });
      return { ...prev, contests };
    });
    
    // Persist to Firestore
    const result = await adminApi.updateContest(contestId, { rounds: newRounds });
    
    if (!result.success) {
      // Rollback on failure
      updateState((prev) => {
        const contests = prev.contests.map((c) => {
          if (c.id !== contestId) return c;
          return normalizeContest({ ...c, rounds: existingRounds });
        });
        return { ...prev, contests };
      });
    }
    
    return result;
  }, [state.contests, updateState]);

  const updateRound = useCallback(async (contestId: string, roundId: string, updates: Partial<ContestRound>): Promise<{ success: boolean; error?: string }> => {
    const contest = state.contests.find((c) => c.id === contestId);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }
    
    const existingRounds = contest.rounds ?? [];
    const newRounds = existingRounds.map((round) =>
      round.id === roundId ? { ...round, ...updates } : round
    );
    
    // Optimistically update local state
    updateState((prev) => {
      const contests = prev.contests.map((c) => {
        if (c.id !== contestId) return c;
        return normalizeContest({ ...c, rounds: newRounds });
      });
      return { ...prev, contests };
    });
    
    // Persist to Firestore
    const result = await adminApi.updateContest(contestId, { rounds: newRounds });
    
    if (!result.success) {
      // Rollback on failure
      updateState((prev) => {
        const contests = prev.contests.map((c) => {
          if (c.id !== contestId) return c;
          return normalizeContest({ ...c, rounds: existingRounds });
        });
        return { ...prev, contests };
      });
    }
    
    return result;
  }, [state.contests, updateState]);

  const removeRound = useCallback(async (contestId: string, roundId: string): Promise<{ success: boolean; error?: string }> => {
    const contest = state.contests.find((c) => c.id === contestId);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }
    
    const existingRounds = contest.rounds ?? [];
    // Remove the round and renumber remaining rounds
    const newRounds = existingRounds
      .filter((round) => round.id !== roundId)
      .map((round, index) => ({
        ...round,
        name: `Round ${index + 1}`,
        number: index + 1,
      }));
    const entries = contest?.entries?.map((drink) =>
      drink.round === roundId ? { ...drink, round: '' } : drink
    );
    
    // Optimistically update local state
    updateState((prev) => {
      const contests = prev.contests.map((c) => {
        if (c.id !== contestId) return c;
        return normalizeContest({ ...c, rounds: newRounds, entries });
      });
      return { ...prev, contests };
    });
    
    // Persist to Firestore
    const result = await adminApi.updateContest(contestId, { rounds: newRounds, entries });
    
    if (!result.success) {
      // Rollback on failure
      updateState((prev) => {
        const contests = prev.contests.map((c) => {
          if (c.id !== contestId) return c;
          return normalizeContest({ ...c, rounds: existingRounds, entries: contest.entries });
        });
        return { ...prev, contests };
      });
    }
    
    return result;
  }, [state.contests, updateState]);

  const setActiveRound = useCallback(async (contestId: string, roundId: string): Promise<{ success: boolean; error?: string }> => {
    const contest = state.contests.find((c) => c.id === contestId);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }
    
    const previousActiveRoundId = contest.activeRoundId;
    
    // Optimistically update local state
    updateState((prev) => {
      const contests = prev.contests.map((c) => {
        if (c.id !== contestId) return c;
        return normalizeContest({ ...c, activeRoundId: roundId });
      });
      return { ...prev, contests };
    });
    
    // Persist to Firestore
    const result = await adminApi.updateContest(contestId, { activeRoundId: roundId });
    
    if (!result.success) {
      // Rollback on failure
      updateState((prev) => {
        const contests = prev.contests.map((c) => {
          if (c.id !== contestId) return c;
          return normalizeContest({ ...c, activeRoundId: previousActiveRoundId });
        });
        return { ...prev, contests };
      });
    }
    
    return result;
  }, [state.contests, updateState]);

  const setRoundState = useCallback(async (contestId: string, roundId: string, newState: ContestPhase): Promise<{ success: boolean; error?: string }> => {
    const contest = state.contests.find((c) => c.id === contestId);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }
    
    const existingRounds = contest.rounds ?? [];
    const newRounds = existingRounds.map((round) =>
      round.id === roundId ? { ...round, state: newState } : round
    );
    
    // Determine the new contest phase based on the active round's state
    const activeRoundId = contest.activeRoundId;
    const newPhase = activeRoundId === roundId ? newState : contest.phase;
    
    // Optimistically update local state
    updateState((prev) => {
      const contests = prev.contests.map((c) => {
        if (c.id !== contestId) return c;
        return normalizeContest({ ...c, rounds: newRounds, phase: newPhase });
      });
      return { ...prev, contests };
    });
    
    // Persist to Firestore
    const result = await adminApi.updateContest(contestId, { rounds: newRounds, phase: newPhase });
    
    if (!result.success) {
      // Rollback on failure
      updateState((prev) => {
        const contests = prev.contests.map((c) => {
          if (c.id !== contestId) return c;
          return normalizeContest({ ...c, rounds: existingRounds, phase: contest.phase });
        });
        return { ...prev, contests };
      });
    }
    
    return result;
  }, [state.contests, updateState]);

  const addContest = useCallback((name: string) => {
    updateState((prev) => {
      const now = new Date().toISOString();
      const newContest = normalizeContest({
        id: generateId('contest'),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        phase: 'set',
        location: '',
        startTime: now,
        bracketRound: 'Round 1',
        defaultContest: false,
        rounds: [],
        activeRoundId: null,
        futureRoundId: null,
        categories: buildDefaultVoteCategories(),
        entries: [],
        judges: [],
        scores: [],
      });
      return { ...prev, contests: [...prev.contests, newContest] };
    });
  }, [updateState]);

  const deleteContest = useCallback(async (contestId: string) => {
    const result = await adminApi.deleteContest(contestId);
    
    if (result.success) {
      updateState((prev) => {
        const contests = prev.contests.filter((contest) => contest.id !== contestId);
        // If we deleted the active contest, switch to the first remaining one
        const activeContestId = prev.activeContestId === contestId
          ? contests.find((c) => c.defaultContest)?.id ?? contests[0]?.id ?? null
          : prev.activeContestId;
        return { ...prev, contests, activeContestId };
      });
      return result;
    }
    
    return result;
  }, [updateState]);

  const addMixologist = useCallback(
    async (contestId: string, mixologist: { name: string; drinkName: string; roundId: string }) => {
      const entry: Omit<Entry, 'id'> = {
        name: mixologist.drinkName,
        slug: mixologist.drinkName.toLowerCase().replace(/\s+/g, '-'),
        description: '',
        round: mixologist.roundId,
        submittedBy: mixologist.name,
      };

      const result = await adminApi.createEntry(contestId, entry);
      
      if (result.success && result.data) {
        updateState((prev) => {
          const contests = prev.contests.map((contest) => {
            if (contest.id !== contestId) return contest;
            return normalizeContest({ ...contest, entries: [...contest.entries, result.data!] });
          });
          return { ...prev, contests };
        });
        return result;
      }
      
      return result;
    },
    [updateState]
  );

  const updateMixologist = useCallback(async (contestId: string, drinkId: string, updates: Partial<Entry>) => {
    const result = await adminApi.updateEntry(contestId, drinkId, updates);
    
    if (result.success && result.data) {
      updateState((prev) => {
        const contests = prev.contests.map((contest) => {
          if (contest.id !== contestId) return contest;
          const entries = contest?.entries?.map((drink) => (drink.id === drinkId ? result.data! : drink)).filter((entry): entry is Entry => entry !== undefined) ?? [];
          return normalizeContest({ ...contest, entries });
        });
        return { ...prev, contests };
      });
      return result;
    }
    
    return result;
  }, [updateState]);

  const removeMixologist = useCallback(async (contestId: string, drinkId: string) => {
    const result = await adminApi.deleteEntry(contestId, drinkId);
    
    if (result.success) {
      updateState((prev) => {
        const contests = prev.contests.map((contest) => {
          if (contest.id !== contestId) return contest;
          const entries = contest?.entries?.filter((drink) => drink.id !== drinkId);
          return normalizeContest({ ...contest, entries });
        });
        return { ...prev, contests };
      });
      return result;
    }
    
    return result;
  }, [updateState]);

  const refresh = useCallback(() => {
    setIsInitialLoad(true);
  }, []);

  const value = useMemo<AdminContestContextValue>(() => {
    const activeContest =
      state.contests.find((contest) => contest.id === state.activeContestId) ??
      state.contests.find((contest) => contest.defaultContest) ??
      null;

    return {
      contests: state.contests,
      activeContestId: activeContest?.id ?? state.activeContestId,
      lastUpdatedAt: state.lastUpdatedAt,
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
      refresh,
    };
  }, [
    state,
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
    refresh,
  ]);

  return <AdminContestContext.Provider value={value}>{children}</AdminContestContext.Provider>;
}

export function useAdminContestData() {
  const context = useContext(AdminContestContext);
  if (!context) {
    throw new Error('useAdminContestData must be used within AdminContestProvider');
  }
  return context;
}
