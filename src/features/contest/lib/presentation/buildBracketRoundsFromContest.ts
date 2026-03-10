import type { BracketRound } from '../../components/ui/BracketView';
import type { Contest } from '../../contexts/contest/contestTypes';
import { getContestRounds, getEntriesForRound, getEntryScore, getRoundStatus } from '../domain/contestGetters';
import { buildEntryPairs } from './uiMappings';

export function buildBracketRoundsFromContest(contest: Contest): BracketRound[] {
  const rounds = getContestRounds(contest);

  return rounds.map((round, index) => {
    const entries = getEntriesForRound(contest, round.id);
    const matchups = buildEntryPairs(entries).map((matchup) => {
      const firstEntry = matchup.contestantA;
      const secondEntry = matchup.contestantB;
      const contestantA = firstEntry
        ? {
            id: firstEntry.id,
            name: firstEntry.name ?? 'TBD',
            score: getEntryScore(firstEntry),
          }
        : { id: 'tbd-a', name: 'TBD', score: null };
      const contestantB = secondEntry
        ? {
            id: secondEntry.id,
            name: secondEntry.name ?? 'TBD',
            score: getEntryScore(secondEntry),
          }
        : { id: 'tbd-b', name: 'TBD', score: null };

      return {
        id: matchup.id,
        contestantA,
        contestantB,
        winnerId: null,
      };
    });

    return {
      id: round.id,
      name: round.name || `Round ${index + 1}`,
      status: getRoundStatus(contest, round.id),
      matchups,
    };
  });
}
