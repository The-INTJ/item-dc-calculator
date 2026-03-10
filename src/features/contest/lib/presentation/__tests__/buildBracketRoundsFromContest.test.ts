import { describe, expect, it } from 'vitest';
import type { Contest } from '../../../contexts/contest/contestTypes';
import { buildBracketRoundsFromContest } from '../buildBracketRoundsFromContest';

describe('buildBracketRoundsFromContest', () => {
  it('derives round matchups and scores from contest entries', () => {
    const contest: Contest = {
      id: 'contest-1',
      name: 'Winter Showdown',
      slug: 'winter-showdown',
      phase: 'shake',
      activeRoundId: 'round-1',
      futureRoundId: 'round-2',
      rounds: [
        { id: 'round-1', name: 'Semifinal', state: 'shake' },
        { id: 'round-2', name: 'Final', state: 'set' },
      ],
      entries: [
        {
          id: 'entry-1',
          name: 'North',
          slug: 'north',
          description: '',
          round: 'round-1',
          submittedBy: 'A',
          sumScore: 18,
          voteCount: 2,
        },
        {
          id: 'entry-2',
          name: 'South',
          slug: 'south',
          description: '',
          round: 'round-1',
          submittedBy: 'B',
          sumScore: 14,
          voteCount: 2,
        },
        {
          id: 'entry-3',
          name: 'East',
          slug: 'east',
          description: '',
          round: 'round-2',
          submittedBy: 'C',
          sumScore: 9,
          voteCount: 1,
        },
      ],
      voters: [],
    };

    const rounds = buildBracketRoundsFromContest(contest);

    expect(rounds).toHaveLength(2);
    expect(rounds[0]).toMatchObject({
      id: 'round-1',
      status: 'active',
      matchups: [
        {
          contestantA: { id: 'entry-1', name: 'North', score: 9 },
          contestantB: { id: 'entry-2', name: 'South', score: 7 },
        },
      ],
    });
    expect(rounds[1]).toMatchObject({
      id: 'round-2',
      status: 'upcoming',
      matchups: [
        {
          contestantA: { id: 'entry-3', name: 'East', score: 9 },
          contestantB: { id: 'tbd-b', name: 'TBD', score: null },
        },
      ],
    });
  });
});
