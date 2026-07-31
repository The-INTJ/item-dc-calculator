import { useCallback } from 'react';
import type { ContestContextStateUpdater, Matchup } from '../contestTypes';

/**
 * The per-contest matchup cache in `matchupsByContestId`. Every matchup action
 * reconciles this map after its API call, and each one has to rebuild the same
 * two levels of immutable state to do it — so the shapes live here and the
 * actions only say what changed.
 */
export function useMatchupCache(
  updateState: (updater: ContestContextStateUpdater) => void,
) {
  const writeMatchups = useCallback(
    (contestId: string, next: (existing: Matchup[]) => Matchup[]) => {
      updateState((prev) => ({
        ...prev,
        matchupsByContestId: {
          ...prev.matchupsByContestId,
          [contestId]: next(prev.matchupsByContestId[contestId] ?? []),
        },
      }));
    },
    [updateState],
  );

  const setMatchupsForContest = useCallback(
    (contestId: string, matchups: Matchup[]) => writeMatchups(contestId, () => matchups),
    [writeMatchups],
  );

  const upsertMatchup = useCallback(
    (contestId: string, matchup: Matchup) =>
      writeMatchups(contestId, (existing) =>
        existing.some((m) => m.id === matchup.id)
          ? existing.map((m) => (m.id === matchup.id ? matchup : m))
          : [...existing, matchup],
      ),
    [writeMatchups],
  );

  const appendMatchup = useCallback(
    (contestId: string, matchup: Matchup) =>
      writeMatchups(contestId, (existing) => [...existing, matchup]),
    [writeMatchups],
  );

  const removeMatchup = useCallback(
    (contestId: string, matchupId: string) =>
      writeMatchups(contestId, (existing) => existing.filter((m) => m.id !== matchupId)),
    [writeMatchups],
  );

  /** Seeding a round replaces that round's matchups and leaves other rounds alone. */
  const replaceRoundMatchups = useCallback(
    (contestId: string, roundId: string, matchups: Matchup[]) =>
      writeMatchups(contestId, (existing) => [
        ...existing.filter((m) => m.roundId !== roundId),
        ...matchups,
      ]),
    [writeMatchups],
  );

  return {
    setMatchupsForContest,
    upsertMatchup,
    appendMatchup,
    removeMatchup,
    replaceRoundMatchups,
  };
}
