import type { BracketRound } from '../components/ui/BracketView';
import type { Contest } from '../types';
import { buildMatchupsFromDrinks } from './uiMappings';
import { getContestRounds, getDrinksForRound, getDrinkScore, getRoundStatus } from './contestHelpers';

export function buildBracketRoundsFromContest(contest: Contest): BracketRound[] {
  const rounds = getContestRounds(contest);

  return rounds.map((round) => {
    const drinks = getDrinksForRound(contest, round.id);
    const matchups = buildMatchupsFromDrinks(drinks).map((matchup) => {
      const [firstId, secondId] = matchup.drinkIds;
      const contestantA = firstId
        ? {
            id: firstId,
            name: drinks.find((drink) => drink.id === firstId)?.name ?? 'TBD',
            score: getDrinkScore(contest.scores, firstId),
          }
        : { id: 'tbd-a', name: 'TBD', score: null };
      const contestantB = secondId
        ? {
            id: secondId,
            name: drinks.find((drink) => drink.id === secondId)?.name ?? 'TBD',
            score: getDrinkScore(contest.scores, secondId),
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
