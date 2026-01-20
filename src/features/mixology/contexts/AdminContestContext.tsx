'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Contest, ContestRound, Drink } from '../types';
import { buildDefaultVoteCategories } from '../components/ui/voteUtils';
import { getActiveRoundId, getFutureRoundId, getRoundLabel } from '../lib/contestHelpers';

interface AdminContestState {
  contests: Contest[];
  activeContestId: string | null;
  lastUpdatedAt: number | null;
}

interface AdminContestContextValue extends AdminContestState {
  setActiveContest: (contestId: string) => void;
  updateContest: (contestId: string, updates: Partial<Contest>) => void;
  addRound: (contestId: string, round: Omit<ContestRound, 'id'>) => void;
  updateRound: (contestId: string, roundId: string, updates: Partial<ContestRound>) => void;
  removeRound: (contestId: string, roundId: string) => void;
  setFutureRound: (contestId: string, roundId: string) => void;
  shakeRound: (contestId: string) => void;
  addMixologist: (contestId: string, mixologist: { name: string; drinkName: string; roundId: string }) => void;
  updateMixologist: (contestId: string, drinkId: string, updates: Partial<Drink>) => void;
  removeMixologist: (contestId: string, drinkId: string) => void;
  refresh: () => void;
}

const STORAGE_KEY = 'mixology-admin-contests-v1';

const defaultRounds: ContestRound[] = [
  { id: 'round-1', name: 'Round 1', number: 1 },
  { id: 'round-2', name: 'Round 2', number: 2 },
  { id: 'round-3', name: 'Finals', number: 3 },
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultContest(): Contest {
  return {
    id: 'contest-local-1',
    name: 'Local Test Contest',
    slug: 'local-test-contest',
    phase: 'setup',
    location: 'Local Only',
    startTime: new Date().toISOString(),
    bracketRound: 'Round 1',
    defaultContest: true,
    rounds: defaultRounds,
    activeRoundId: 'round-1',
    futureRoundId: 'round-2',
    categories: buildDefaultVoteCategories(),
    drinks: [],
    judges: [],
    scores: [],
  };
}

function normalizeContest(contest: Contest): Contest {
  const rounds = contest.rounds ?? [];
  const activeRoundId = getActiveRoundId({ ...contest, rounds });
  const futureRoundId = getFutureRoundId({ ...contest, rounds, activeRoundId });
  const bracketRound = getRoundLabel({ ...contest, rounds }, activeRoundId);

  return {
    ...contest,
    rounds,
    activeRoundId,
    futureRoundId,
    bracketRound,
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

  useEffect(() => {
    persistState(state);
  }, [state]);

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

  const addRound = useCallback((contestId: string, round: Omit<ContestRound, 'id'>) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const nextRound: ContestRound = { ...round, id: generateId('round') };
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

  const setFutureRound = useCallback((contestId: string, roundId: string) => {
    updateState((prev) => {
      const futureRoundId = roundId || null;
      const contests = prev.contests.map((contest) =>
        contest.id === contestId ? normalizeContest({ ...contest, futureRoundId }) : contest
      );
      return { ...prev, contests };
    });
  }, [updateState]);

  const shakeRound = useCallback((contestId: string) => {
    updateState((prev) => {
      const contests = prev.contests.map((contest) => {
        if (contest.id !== contestId) return contest;
        const nextActive = contest.futureRoundId ?? getFutureRoundId(contest);
        if (!nextActive) return contest;
        return normalizeContest({
          ...contest,
          activeRoundId: nextActive,
          futureRoundId: null,
        });
      });
      return { ...prev, contests };
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
      addRound,
      updateRound,
      removeRound,
      setFutureRound,
      shakeRound,
      addMixologist,
      updateMixologist,
      removeMixologist,
      refresh,
    };
  }, [state, setActiveContest, updateContest, addRound, updateRound, removeRound, setFutureRound, shakeRound, addMixologist, updateMixologist, removeMixologist, refresh]);

  return <AdminContestContext.Provider value={value}>{children}</AdminContestContext.Provider>;
}

export function useAdminContestData() {
  const context = useContext(AdminContestContext);
  if (!context) {
    throw new Error('useAdminContestData must be used within AdminContestProvider');
  }
  return context;
}
