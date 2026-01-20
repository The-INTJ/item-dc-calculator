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
  useLocalDebugData: boolean;
  setUseLocalDebugData: (enabled: boolean) => void;
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
const DEBUG_STORAGE_KEY = 'mixology-admin-debug-contests-v1';
const DEBUG_TOGGLE_KEY = 'mixology-admin-local-debug-data-v1';

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

function buildDebugContests(): Contest[] {
  return [
    {
      id: 'contest-impossible-1',
      name: 'Impossible Invitational',
      slug: 'impossible-invitational',
      phase: 'shake',
      location: 'Nowhere Annex',
      startTime: '2024-04-01T18:30:00Z',
      bracketRound: 'Round ?: Mystery',
      currentDrinkId: 'drink-ghost',
      defaultContest: true,
      rounds: [
        { id: 'round-zero', name: 'Round Zero', number: 0, state: 'scored' },
        { id: 'round-one', name: 'Round One', number: 1, state: 'shake' },
        { id: 'round-two', name: 'Round Two', number: 2, state: 'set' },
      ],
      activeRoundId: 'round-missing',
      futureRoundId: 'round-phantom',
      categories: buildDefaultVoteCategories(),
      drinks: [
        {
          id: 'drink-siren',
          name: 'Siren Signal',
          slug: 'siren-signal',
          description: 'Smoked saline spritz with a phantom garnish.',
          round: 'round-zero',
          submittedBy: 'Team Mirage',
        },
        {
          id: 'drink-null',
          name: 'Null & Void',
          slug: 'null-and-void',
          description: 'Missing notes on purpose to test fallbacks.',
          round: 'Round Zero',
          submittedBy: 'Team Missing',
        },
        {
          id: 'drink-ghost',
          name: 'Ghost Variable',
          slug: 'ghost-variable',
          description: 'Exists as the current drink but the round is missing.',
          round: 'round-ghost',
          submittedBy: 'Team 404',
        },
      ],
      judges: [
        { id: 'judge-admin', displayName: 'Admin Debug', role: 'admin', contact: 'debug@example.com' },
        { id: 'judge-viewer', displayName: 'Viewer V.', role: 'viewer' },
        { id: 'judge-missing', displayName: 'Judge Missing', role: 'judge' },
      ],
      scores: [
        {
          id: 'score-impossible',
          drinkId: 'drink-ghost',
          judgeId: 'judge-viewer',
          breakdown: { aroma: 15, balance: -2, presentation: 0, creativity: 42, overall: 9 },
          notes: 'Out-of-range totals to test validation.',
        },
        {
          id: 'score-orphaned',
          drinkId: 'drink-does-not-exist',
          judgeId: 'judge-admin',
          breakdown: { aroma: 8, balance: 8, presentation: 8, creativity: 8, overall: 8 },
          notes: 'References a missing drink.',
        },
        {
          id: 'score-unknown-judge',
          drinkId: 'drink-siren',
          judgeId: 'judge-unknown',
          breakdown: { aroma: 7, balance: 7, presentation: 7, creativity: 7, overall: 7 },
        },
      ],
    },
    {
      id: 'contest-edgecase-2',
      name: 'Edge Case Cup',
      slug: 'edge-case-cup',
      phase: 'set',
      location: 'Underflow Hall',
      startTime: '2024-05-20T20:00:00Z',
      bracketRound: 'Qualifiers',
      defaultContest: false,
      rounds: [
        { id: 'round-alpha', name: 'Alpha Round', number: 1, state: 'set' },
        { id: 'round-beta', name: 'Beta Round', number: 2, state: 'scored' },
      ],
      activeRoundId: 'round-alpha',
      futureRoundId: 'round-beta',
      categories: buildDefaultVoteCategories(),
      drinks: [
        {
          id: 'drink-echo',
          name: 'Echo Chamber',
          slug: 'echo-chamber',
          description: 'Duplicate rounds, duplicate judges.',
          round: 'round-alpha',
          submittedBy: 'Team Loop',
        },
        {
          id: 'drink-oddball',
          name: 'Oddball Old Fashioned',
          slug: 'oddball-old-fashioned',
          description: 'Drink assigned to a future round name instead of ID.',
          round: 'Beta Round',
          submittedBy: 'Team Timewarp',
        },
      ],
      judges: [
        { id: 'judge-alpha', displayName: 'Alpha', role: 'judge' },
        { id: 'judge-beta', displayName: 'Beta', role: 'judge' },
        { id: 'judge-viewer-2', displayName: 'Viewer Two', role: 'viewer' },
      ],
      scores: [
        {
          id: 'score-alpha',
          drinkId: 'drink-echo',
          judgeId: 'judge-alpha',
          breakdown: { aroma: 5, balance: 5, presentation: 5, creativity: 5, overall: 5 },
        },
        {
          id: 'score-viewer',
          drinkId: 'drink-oddball',
          judgeId: 'judge-viewer-2',
          breakdown: { aroma: 10, balance: 10, presentation: 10, creativity: 10, overall: 10 },
          notes: 'Viewer role submitted a score.',
        },
      ],
    },
    {
      id: 'contest-null-3',
      name: 'Phantom Bracket',
      slug: 'phantom-bracket',
      phase: 'debug',
      location: undefined,
      startTime: undefined,
      bracketRound: undefined,
      defaultContest: false,
      rounds: [],
      activeRoundId: null,
      futureRoundId: null,
      categories: buildDefaultVoteCategories(),
      drinks: [],
      judges: [],
      scores: [],
    },
  ];
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

function loadDebugToggle(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DEBUG_TOGGLE_KEY) === 'true';
}

function persistDebugToggle(enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEBUG_TOGGLE_KEY, String(enabled));
}

function getStorageKey(useLocalDebugData: boolean) {
  return useLocalDebugData ? DEBUG_STORAGE_KEY : STORAGE_KEY;
}

function buildInitialState(useLocalDebugData: boolean): AdminContestState {
  const contests = useLocalDebugData ? buildDebugContests() : [buildDefaultContest()];
  const normalized = contests.map((contest) => normalizeContest(contest));
  const activeContestId = normalized.find((contest) => contest.defaultContest)?.id ?? normalized[0]?.id ?? null;
  const normalizedContests = activeContestId
    ? normalized.map((contest) => ({ ...contest, defaultContest: contest.id === activeContestId }))
    : normalized;
  return { contests: normalizedContests, activeContestId, lastUpdatedAt: null };
}

function loadState(useLocalDebugData: boolean): AdminContestState {
  if (typeof window === 'undefined') {
    return buildInitialState(useLocalDebugData);
  }

  const stored = window.localStorage.getItem(getStorageKey(useLocalDebugData));
  if (!stored) {
    return buildInitialState(useLocalDebugData);
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
    return buildInitialState(useLocalDebugData);
  }
}

function persistState(state: AdminContestState, useLocalDebugData: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(useLocalDebugData), JSON.stringify(state));
}

const AdminContestContext = createContext<AdminContestContextValue | undefined>(undefined);

export function AdminContestProvider({ children }: { children: React.ReactNode }) {
  const initialDebug = loadDebugToggle();
  const [useLocalDebugData, setUseLocalDebugData] = useState(initialDebug);
  const [state, setState] = useState<AdminContestState>(() => loadState(initialDebug));
  const { setState: setGlobalState } = useContestState();

  useEffect(() => {
    persistState(state, useLocalDebugData);
  }, [state, useLocalDebugData]);

  // Sync active contest's phase to global ContestState whenever it changes
  useEffect(() => {
    const activeContest =
      state.contests.find((c) => c.id === state.activeContestId) ??
      state.contests.find((c) => c.defaultContest);
    if (activeContest) {
      setGlobalState(activeContest.phase);
    }
  }, [state, setGlobalState]);

  const handleSetUseLocalDebugData = useCallback((enabled: boolean) => {
    setUseLocalDebugData(enabled);
    persistDebugToggle(enabled);
    setState(loadState(enabled));
  }, []);

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
    setState(loadState(useLocalDebugData));
  }, [useLocalDebugData]);

  const value = useMemo<AdminContestContextValue>(() => {
    const activeContest =
      state.contests.find((contest) => contest.id === state.activeContestId) ??
      state.contests.find((contest) => contest.defaultContest) ??
      null;

    return {
      contests: state.contests,
      activeContestId: activeContest?.id ?? state.activeContestId,
      lastUpdatedAt: state.lastUpdatedAt,
      useLocalDebugData,
      setUseLocalDebugData: handleSetUseLocalDebugData,
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
  }, [
    state,
    useLocalDebugData,
    handleSetUseLocalDebugData,
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
