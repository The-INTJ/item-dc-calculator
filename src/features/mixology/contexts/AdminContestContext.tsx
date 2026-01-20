'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Contest, ContestPhase, ContestRound, Drink } from '../types';
import { buildDefaultVoteCategories } from '../components/ui/voteUtils';
import { getActiveRoundId, getRoundById, getRoundLabel } from '../lib/contestHelpers';
import { useContestState } from './ContestStateContext';

interface AdminContestState {
  contests: Contest[];
  activeContestId: string | null;
  lastUpdatedAt: number | null;
}

interface AdminContestContextValue extends AdminContestState {
  setActiveContest: (contestId: string) => void;
  updateContest: (contestId: string, updates: Partial<Contest>) => void;
  addContest: (name: string) => void;
  addRound: (contestId: string, round: Omit<ContestRound, 'id' | 'state'>) => void;
  updateRound: (contestId: string, roundId: string, updates: Partial<ContestRound>) => void;
  removeRound: (contestId: string, roundId: string) => void;
  setActiveRound: (contestId: string, roundId: string) => void;
  setRoundState: (contestId: string, roundId: string, state: ContestPhase) => void;
  addMixologist: (contestId: string, mixologist: { name: string; drinkName: string; roundId: string }) => void;
  updateMixologist: (contestId: string, drinkId: string, updates: Partial<Drink>) => void;
  removeMixologist: (contestId: string, drinkId: string) => void;
  refresh: () => void;
}

const STORAGE_KEY = 'mixology-admin-contests-v1';

const defaultRounds: ContestRound[] = [
  { id: 'round-1', name: 'Round 1', number: 1, state: 'set' },
  { id: 'round-2', name: 'Round 2', number: 2, state: 'set' },
  { id: 'round-3', name: 'Finals', number: 3, state: 'set' },
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultContest(): Contest {
  return {
    id: 'contest-local-1',
    name: 'Local Test Contest',
    slug: 'local-test-contest',
    phase: 'debug',
    location: 'Local Only',
    startTime: new Date().toISOString(),
    bracketRound: 'Round 1',
    defaultContest: true,
    rounds: defaultRounds,
    activeRoundId: 'round-1',
    futureRoundId: null,
    categories: buildDefaultVoteCategories(),
    drinks: [],
    judges: [],
    scores: [],
  };
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
  const phase = activeRound?.state ?? contest.phase ?? 'debug';

  return {
    ...contest,
    rounds,
    activeRoundId,
    bracketRound,
    phase,
  };
}

function loadState(): AdminContestState {
  if (typeof window === 'undefined') {
    const contest = normalizeContest(buildDefaultContest());
    return { contests: [contest], activeContestId: contest.id, lastUpdatedAt: null };
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const contest = normalizeContest(buildDefaultContest());
    return { contests: [contest], activeContestId: contest.id, lastUpdatedAt: null };
  }

  try {
    const parsed = JSON.parse(stored) as AdminContestState;
    const contests = (parsed.contests ?? []).map((contest) => normalizeContest(contest));
    const activeContestId = parsed.activeContestId ?? contests.find((c) => c.defaultContest)?.id ?? null;
    const normalizedContests = activeContestId
      ? contests.map((contest) => ({ ...contest, defaultContest: contest.id === activeContestId }))
      : contests;
    return { contests: normalizedContests, activeContestId, lastUpdatedAt: parsed.lastUpdatedAt ?? null };
  } catch {
    const contest = normalizeContest(buildDefaultContest());
    return { contests: [contest], activeContestId: contest.id, lastUpdatedAt: null };
  }
}

function persistState(state: AdminContestState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const AdminContestContext = createContext<AdminContestContextValue | undefined>(undefined);

export function AdminContestProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminContestState>(() => loadState());
  const { setState: setGlobalState } = useContestState();

  useEffect(() => {
    persistState(state);
  }, [state]);

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

  const setActiveContest = useCallback((contestId: string) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => ({
        ...contest,
        defaultContest: contest.id === contestId,
      }));
      return { ...prev, contests, activeContestId: contestId };
    });
  }, [updateState]);

  const addRound = useCallback((contestId: string, round: Omit<ContestRound, 'id' | 'state'>) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const nextRound: ContestRound = { ...round, id: generateId('round'), state: 'set' };
        return normalizeContest({
          ...contest,
          rounds: [...(contest.rounds ?? []), nextRound],
        });
      });
      return { ...prev, contests };
    });
  }, [updateState]);

  const updateRound = useCallback((contestId: string, roundId: string, updates: Partial<ContestRound>) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const rounds = (contest.rounds ?? []).map((round) =>
          round.id === roundId ? { ...round, ...updates } : round
        );
        return normalizeContest({ ...contest, rounds });
      });
      return { ...prev, contests };
    });
  }, [updateState]);

  const removeRound = useCallback((contestId: string, roundId: string) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const rounds = (contest.rounds ?? []).filter((round) => round.id !== roundId);
        const drinks = contest.drinks.map((drink) =>
          drink.round === roundId ? { ...drink, round: '' } : drink
        );
        return normalizeContest({ ...contest, rounds, drinks });
      });
      return { ...prev, contests };
    });
  }, [updateState]);

  const setActiveRound = useCallback((contestId: string, roundId: string) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        return normalizeContest({ ...contest, activeRoundId: roundId });
      });
      return { ...prev, contests };
    });
  }, [updateState]);

  const setRoundState = useCallback((contestId: string, roundId: string, newState: ContestPhase) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const rounds = (contest.rounds ?? []).map((round) =>
          round.id === roundId ? { ...round, state: newState } : round
        );
        return normalizeContest({ ...contest, rounds });
      });
      return { ...prev, contests };
    });
  }, [updateState]);

  const addContest = useCallback((name: string) => {
    updateState((prev) => {
      const newContest = normalizeContest({
        ...buildDefaultContest(),
        id: generateId('contest'),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        defaultContest: false,
      });
      return { ...prev, contests: [...prev.contests, newContest] };
    });
  }, [updateState]);

  const addMixologist = useCallback(
    (contestId: string, mixologist: { name: string; drinkName: string; roundId: string }) => {
      updateState((prev) => {
        const contests = prev.contests.map((contest) => {
          if (contest.id !== contestId) return contest;
          const drink: Drink = {
            id: generateId('drink'),
            name: mixologist.drinkName,
            slug: mixologist.drinkName.toLowerCase().replace(/\s+/g, '-'),
            description: '',
            round: mixologist.roundId,
            submittedBy: mixologist.name,
          };
          return normalizeContest({ ...contest, drinks: [...contest.drinks, drink] });
        });
        return { ...prev, contests };
      });
    },
    [updateState]
  );

  const updateMixologist = useCallback((contestId: string, drinkId: string, updates: Partial<Drink>) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const drinks = contest.drinks.map((drink) => (drink.id === drinkId ? { ...drink, ...updates } : drink));
        return normalizeContest({ ...contest, drinks });
      });
      return { ...prev, contests };
    });
  }, [updateState]);

  const removeMixologist = useCallback((contestId: string, drinkId: string) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const drinks = contest.drinks.filter((drink) => drink.id !== drinkId);
        return normalizeContest({ ...contest, drinks });
      });
      return { ...prev, contests };
    });
  }, [updateState]);

  const refresh = useCallback(() => {
    setState(loadState());
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
      addContest,
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
  }, [state, setActiveContest, updateContest, addContest, addRound, updateRound, removeRound, setActiveRound, setRoundState, addMixologist, updateMixologist, removeMixologist, refresh]);

  return <AdminContestContext.Provider value={value}>{children}</AdminContestContext.Provider>;
}

export function useAdminContestData() {
  const context = useContext(AdminContestContext);
  if (!context) {
    throw new Error('useAdminContestData must be used within AdminContestProvider');
  }
  return context;
}
