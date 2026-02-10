import type { BracketRound } from '../../components/ui/BracketView';
import type { Contest } from '../../contexts/contest/contestTypes';
import { buildMatchupsFromEntries } from './uiMappings';
import { getContestRounds, getEntriesForRound, getEntryScore, getRoundStatus } from './contestGetters';

export function buildBracketRoundsFromContest(contest: Contest): BracketRound[] {
  const rounds = getContestRounds(contest);

  return rounds.map((round, index) => {
    const entries = getEntriesForRound(contest, round.id);
    const matchups = buildMatchupsFromEntries(entries).map((matchup) => {
      const [firstId, secondId] = matchup.entryIds ?? [];
      const firstEntry = firstId ? entries?.find((entry) => entry.id === firstId) : null;
      const secondEntry = secondId ? entries?.find((entry) => entry.id === secondId) : null;
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
      name: `Round ${index + 1}`,
      status: getRoundStatus(contest, round.id),
      matchups,
    };
  });
}
