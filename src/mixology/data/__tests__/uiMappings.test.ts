import { describe, expect, it } from 'vitest';
import type { Contest, Drink } from '../../types';
import {
  buildMatchupsFromDrinks,
  buildRoundDetail,
  buildRoundSummary,
  buildVoteTotals,
} from '../uiMappings';

const baseContest: Contest = {
  id: 'contest-1',
  name: 'Cascadia Classic',
  slug: 'cascadia-classic',
  phase: 'active',
  categories: [
    { id: 'aroma', label: 'Aroma', sortOrder: 0 },
    { id: 'balance', label: 'Balance', sortOrder: 1 },
    { id: 'overall', label: 'Overall', sortOrder: 2 },
  ],
  drinks: [],
  judges: [],
  scores: [],
};

function drink(id: string, submittedBy = 'Team A'): Drink {
  return {
    id,
    name: `Drink ${id}`,
    slug: id,
    description: 'Test drink',
    round: 'Round 1',
    submittedBy,
  };
}

describe('uiMappings', () => {
  // Assumption: if no bracket label is provided, UI should default to “Current Round”.
  it('uses Current Round when bracketRound is missing', () => {
    const summary = buildRoundSummary({ ...baseContest, bracketRound: undefined });
    expect(summary.name).toBe('Current Round');
  });

  // Assumption: contestant names derive from drink submitters and are unique.
  it('deduplicates contestant names in round summary', () => {
    const summary = buildRoundSummary({
      ...baseContest,
      drinks: [drink('a', 'Team A'), drink('b', 'Team A'), drink('c', 'Team B')],
    });

    expect(summary.contestantNames).toEqual(['Team A', 'Team B']);
  });

  // Assumption: matchups are derived by pairing drinks in order, allowing a trailing solo drink.
  it('pairs drinks into ordered matchups', () => {
    const matchups = buildMatchupsFromDrinks([drink('a'), drink('b'), drink('c')]);

    expect(matchups).toEqual([
      { id: 'matchup-1', drinkIds: ['a', 'b'] },
      { id: 'matchup-2', drinkIds: ['c'] },
    ]);
  });

  // Assumption: vote totals aggregate scores by configured categories.
  it('maps scores into category totals', () => {
    const voteTotals = buildVoteTotals({
      ...baseContest,
      scores: [
        {
          id: 'score-1',
          drinkId: 'drink-1',
          judgeId: 'judge-1',
          breakdown: {
            aroma: 7,
            balance: 8,
            presentation: 9,
            creativity: 6,
            overall: 8,
          },
        },
      ],
    });

    expect(voteTotals).toEqual([
      {
        drinkId: 'drink-1',
        categoryId: 'aroma',
        total: 7,
        userHasVoted: true,
      },
      {
        drinkId: 'drink-1',
        categoryId: 'balance',
        total: 8,
        userHasVoted: true,
      },
      {
        drinkId: 'drink-1',
        categoryId: 'overall',
        total: 8,
        userHasVoted: true,
      },
    ]);
  });

  // Assumption: round detail should reuse the summary label and include drinks + matchups.
  it('builds a round detail snapshot from contest data', () => {
    const contest = {
      ...baseContest,
      bracketRound: 'Semifinals',
      drinks: [drink('a'), drink('b')],
    };

    const detail = buildRoundDetail(contest);

    expect(detail.name).toBe('Semifinals');
    expect(detail.drinks.map((item) => item.id)).toEqual(['a', 'b']);
    expect(detail.matchups).toEqual([{ id: 'matchup-1', drinkIds: ['a', 'b'] }]);
  });
});
