'use client';

import { useState } from 'react';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { pairWithByes } from '../../lib/domain/bracketMath';

export type PendingRoundAction =
  | { kind: 'reseed'; roundId: string; roundIndex: number; matchupCount: number; hasVotes: boolean }
  | { kind: 'forceClose'; roundId: string; openCount: number };

function autoPairContestants(contestantIds: string[]): Array<[string, string] | [string]> {
  const { pairs, byeId } = pairWithByes(contestantIds);
  const slots: Array<[string, string] | [string]> = [...pairs];
  if (byeId) slots.push([byeId]);
  return slots;
}

/**
 * Copy for the shared confirm dialog covering destructive round actions.
 */
export function describePendingAction(action: PendingRoundAction | null) {
  return {
    title: action?.kind === 'reseed' ? 'Reseed this round?' : 'Force close this round?',
    message:
      action?.kind === 'reseed'
        ? `Reseeding deletes ${action.matchupCount} existing matchup${action.matchupCount === 1 ? '' : 's'}${action.hasVotes ? ' along with their recorded scores' : ''} and creates fresh ones. This cannot be undone.`
        : action?.kind === 'forceClose'
          ? `Force closing ends voting for ${action.openCount} open matchup${action.openCount === 1 ? '' : 's'} and records winners from current scores (ties stay undecided for you to resolve).`
          : '',
    confirmLabel: action?.kind === 'reseed' ? 'Reseed round' : 'Force close round',
  };
}

/**
 * Owns the destructive round actions (seeding, force close) plus the shared
 * confirmation state and per-round seed errors behind them.
 */
export function useRoundActions(contest: Contest) {
  const { seedRound, setRoundOverride } = useContestStore();

  const [seedErrorByRound, setSeedErrorByRound] = useState<Record<string, string>>({});
  const setSeedError = (roundId: string, error: string | null) => {
    setSeedErrorByRound((prev) => {
      if (error == null) {
        if (!(roundId in prev)) return prev;
        const next = { ...prev };
        delete next[roundId];
        return next;
      }
      return { ...prev, [roundId]: error };
    });
  };

  const [pendingAction, setPendingAction] = useState<PendingRoundAction | null>(null);

  const performSeed = async (roundId: string, roundIndex: number) => {
    setSeedError(roundId, null);
    const result =
      roundIndex === 0
        ? await seedRound(
            contest.id,
            roundId,
            autoPairContestants(contest.contestants.map((c) => c.id)),
          )
        : await seedRound(contest.id, roundId);
    if (result.error) setSeedError(roundId, result.error);
  };

  const requestSeed = (roundId: string, roundIndex: number, roundMatchups: Matchup[]) => {
    if (roundMatchups.length > 0) {
      setPendingAction({
        kind: 'reseed',
        roundId,
        roundIndex,
        matchupCount: roundMatchups.length,
        hasVotes: roundMatchups.some((m) =>
          m.entries.some((e) => (e.voteCount ?? 0) > 0),
        ),
      });
    } else {
      void performSeed(roundId, roundIndex);
    }
  };

  const requestForceClose = (roundId: string, roundMatchups: Matchup[]) => {
    const openCount = roundMatchups.filter((m) => m.phase !== 'scored').length;
    if (openCount > 0) {
      setPendingAction({ kind: 'forceClose', roundId, openCount });
    } else {
      void setRoundOverride(contest.id, roundId, 'closed');
    }
  };

  const confirmPendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    if (action.kind === 'reseed') {
      await performSeed(action.roundId, action.roundIndex);
    } else {
      await setRoundOverride(contest.id, action.roundId, 'closed');
    }
  };

  const cancelPendingAction = () => setPendingAction(null);

  return {
    seedErrorByRound,
    pendingAction,
    requestSeed,
    requestForceClose,
    confirmPendingAction,
    cancelPendingAction,
  };
}
