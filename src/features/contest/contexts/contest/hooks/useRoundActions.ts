import { useCallback, useRef } from 'react';
import type { Contest, ContestRound } from '../contestTypes';
import { contestApi } from '../../../lib/api/contestApi';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Round mutations on `contest.rounds`. Add/remove rewrite the whole rounds
 * array (the API replaces it), so appends are serialized per contest.
 */
export function useRoundActions(
  getContestById: (id: string) => Contest | undefined,
  replaceContest: (contest: Contest) => void,
) {
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

  return { addRound, updateRound, removeRound, setRoundOverride };
}
