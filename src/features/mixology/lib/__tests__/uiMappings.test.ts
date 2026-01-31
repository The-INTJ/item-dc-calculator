import { describe, expect, it } from 'vitest';
import type { Contest, Entry } from '../../types';
import {
  buildMatchupsFromEntries,
  buildRoundDetail,
  buildRoundSummary,
  buildVoteTotals,
} from '../uiMappings';

const baseContest: Contest = {
  id: 'contest-1',
  name: 'Cascadia Classic',
  slug: 'cascadia-classic',
  phase: 'shake',
  rounds: [{ id: 'round-1', name: 'Round 1', number: 1, state: 'shake' }],
  activeRoundId: 'round-1',
  categories: [
    { id: 'aroma', label: 'Aroma', sortOrder: 0 },
    { id: 'balance', label: 'Balance', sortOrder: 1 },
    { id: 'overall', label: 'Overall', sortOrder: 2 },
  ],
  entries: [],
  judges: [],
  scores: [],
};

function drink(id: string, submittedBy = 'Team A'): Entry {
  return {
    id,
    name: `Drink ${id}`,
    slug: id,
    description: 'Test drink',
    round: 'round-1',
    submittedBy,
  };
}

describe('uiMappings', () => {
  // When there's an active round, use the round's name
  it('uses active round name when available', () => {
    const summary = buildRoundSummary({ ...baseContest, bracketRound: undefined });
    expect(summary.name).toBe('Round 1');
  });

  // Assumption: contestant names derive from drink submitters and are unique.
  it('deduplicates contestant names in round summary', () => {
    const summary = buildRoundSummary({
      ...baseContest,
      entries: [drink('a', 'Team A'), drink('b', 'Team A'), drink('c', 'Team B')],
    });

    expect(summary.contestantNames).toEqual(['Team A', 'Team B']);
  });

  // Assumption: matchups are derived by pairing drinks in order, allowing a trailing solo drink.
  it('pairs drinks into ordered matchups', () => {
    const matchups = buildMatchupsFromEntries([drink('a'), drink('b'), drink('c')]);

    expect(matchups).toEqual([
      { id: 'matchup-1', entryIds: ['a', 'b'] },
      { id: 'matchup-2', entryIds: ['c'] },
    ]);
  });

  // Assumption: vote totals aggregate scores by configured categories.
  it('maps scores into category totals', () => {
    const voteTotals = buildVoteTotals({
      ...baseContest,
      scores: [
        {
          id: 'score-1',
          entryId: 'drink-1',
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
        entryId: 'drink-1',
        categoryId: 'aroma',
        total: 7,
        userHasVoted: true,
      },
      {
        entryId: 'drink-1',
        categoryId: 'balance',
        total: 8,
        userHasVoted: true,
      },
      {
        entryId: 'drink-1',
        categoryId: 'overall',
        total: 8,
        userHasVoted: true,
      },
    ]);
  });

  // Assumption: round detail should use the active round's name and include drinks + matchups.
  it('builds a round detail snapshot from contest data', () => {
    const contest = {
      ...baseContest,
      rounds: [{ id: 'round-1', name: 'Semifinals', number: 1, state: 'shake' as const }],
      activeRoundId: 'round-1',
      entries: [drink('a'), drink('b')],
    };

    const detail = buildRoundDetail(contest);

    expect(detail.name).toBe('Semifinals');
    expect(detail?.entries?.map((item) => item.id)).toEqual(['a', 'b']);
    expect(detail.matchups).toEqual([{ id: 'matchup-1', entryIds: ['a', 'b'] }]);
  });
});
