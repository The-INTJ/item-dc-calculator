import type { BracketRound } from '../components/ui/BracketView';
import type { Contest } from '../types';
import { buildMatchupsFromEntries } from './uiMappings';
import { getContestRounds, getEntriesForRound, getEntryScore, getRoundStatus } from './contestHelpers';

export function buildBracketRoundsFromContest(contest: Contest): BracketRound[] {
  const rounds = getContestRounds(contest);

  return rounds.map((round) => {
    const entries = getEntriesForRound(contest, round.id);
    const matchups = buildMatchupsFromEntries(entries).map((matchup) => {
      const [firstId, secondId] = matchup.entryIds ?? [];
      const contestantA = firstId
        ? {
            id: firstId,
            name: entries.find((entry) => entry.id === firstId)?.name ?? 'TBD',
            score: getEntryScore(contest.scores, firstId),
          }
        : { id: 'tbd-a', name: 'TBD', score: null };
      const contestantB = secondId
        ? {
            id: secondId,
            name: entries.find((entry) => entry.id === secondId)?.name ?? 'TBD',
            score: getEntryScore(contest.scores, secondId),
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
      name: round.name,
      status: getRoundStatus(contest, round.id),
      matchups,
    };
  });
}
