import { describe, expect, it } from 'vitest';
import type { Contest, Matchup } from '../../../contexts/contest/contestTypes';
import { buildBracketRoundsFromContest } from '../buildBracketRoundsFromContest';

describe('buildBracketRoundsFromContest', () => {
  it('drives rounds and matchupIds from a stored matchup collection', () => {
    const contest: Contest = {
      id: 'contest-m',
      name: 'Matchup Driven',
      slug: 'matchup-driven',
      rounds: [
        { id: 'r1', name: 'Semifinal' },
        { id: 'r2', name: 'Final' },
      ],
      entries: [
        { id: 'e1', name: 'Alpha', slug: 'alpha', description: '', submittedBy: 'A', sumScore: 20, voteCount: 2 },
        { id: 'e2', name: 'Beta', slug: 'beta', description: '', submittedBy: 'B', sumScore: 10, voteCount: 2 },
        { id: 'e3', name: 'Gamma', slug: 'gamma', description: '', submittedBy: 'C', sumScore: 16, voteCount: 2 },
        { id: 'e4', name: 'Delta', slug: 'delta', description: '', submittedBy: 'D', sumScore: 8, voteCount: 2 },
      ],
      voters: [],
    };
    const matchups: Matchup[] = [
      {
        id: 'm-1',
        contestId: 'contest-m',
        roundId: 'r1',
        slotIndex: 0,
        entryIds: ['e1', 'e2'],
        phase: 'scored',
        winnerEntryId: 'e1',
      },
      {
        id: 'm-2',
        contestId: 'contest-m',
        roundId: 'r1',
        slotIndex: 1,
        entryIds: ['e3', 'e4'],
        phase: 'shake',
      },
    ];

    const rounds = buildBracketRoundsFromContest(contest, matchups);

    expect(rounds).toHaveLength(2);
    expect(rounds[0]).toMatchObject({
      id: 'r1',
      status: 'active',
    });
    expect(rounds[0].matchups).toHaveLength(2);
    expect(rounds[0].matchups[0]).toMatchObject({
      id: 'm-1',
      matchupId: 'm-1',
      phase: 'scored',
      winnerId: 'e1',
      contestantA: { id: 'e1', name: 'Alpha' },
      contestantB: { id: 'e2', name: 'Beta' },
    });
    expect(rounds[0].matchups[1]).toMatchObject({
      id: 'm-2',
      matchupId: 'm-2',
      phase: 'shake',
      contestantA: { id: 'e3', name: 'Gamma' },
      contestantB: { id: 'e4', name: 'Delta' },
    });
    expect(rounds[1]).toMatchObject({
      id: 'r2',
      status: 'pending',
      matchups: [],
    });
  });

  it('returns empty rounds when matchups are absent', () => {
    const contest: Contest = {
      id: 'contest-empty',
      name: 'Empty',
      slug: 'empty',
      rounds: [{ id: 'r1', name: 'Only' }],
      entries: [],
      voters: [],
    };

    const rounds = buildBracketRoundsFromContest(contest, []);

    expect(rounds).toHaveLength(1);
    expect(rounds[0].matchups).toEqual([]);
    expect(rounds[0].status).toBe('pending');
  });
});
