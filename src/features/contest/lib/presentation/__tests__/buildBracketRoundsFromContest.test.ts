import { describe, expect, it } from 'vitest';
import type { Contest, Entry, Matchup } from '../../../contexts/contest/contestTypes';
import { buildBracketRoundsFromContest } from '../buildBracketRoundsFromContest';

function entry(id: string, contestantId: string, name: string, sumScore = 0, voteCount = 0): Entry {
  return { id, contestantId, matchupId: '', name, sumScore, voteCount };
}

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
      contestants: [
        { id: 'cA', displayName: 'A' },
        { id: 'cB', displayName: 'B' },
        { id: 'cC', displayName: 'C' },
        { id: 'cD', displayName: 'D' },
      ],
      voters: [],
    };
    const matchups: Matchup[] = [
      {
        id: 'm-1',
        contestId: 'contest-m',
        roundId: 'r1',
        slotIndex: 0,
        entries: [entry('e1', 'cA', 'Alpha', 20, 2), entry('e2', 'cB', 'Beta', 10, 2)],
        phase: 'scored',
        winnerEntryId: 'e1',
      },
      {
        id: 'm-2',
        contestId: 'contest-m',
        roundId: 'r1',
        slotIndex: 1,
        entries: [entry('e3', 'cC', 'Gamma', 16, 2), entry('e4', 'cD', 'Delta', 8, 2)],
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
    });
    expect(rounds[0].matchups[0].contestantA.id).toBe('e1');
    expect(rounds[0].matchups[0].contestantA.name).toContain('Alpha');
    expect(rounds[0].matchups[0].contestantB.id).toBe('e2');
    expect(rounds[0].matchups[1]).toMatchObject({
      id: 'm-2',
      matchupId: 'm-2',
      phase: 'shake',
    });
    expect(rounds[0].matchups[1].contestantA.id).toBe('e3');
    expect(rounds[0].matchups[1].contestantB.id).toBe('e4');
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
      contestants: [],
      voters: [],
    };

    const rounds = buildBracketRoundsFromContest(contest, []);

    expect(rounds).toHaveLength(1);
    expect(rounds[0].matchups).toEqual([]);
    expect(rounds[0].status).toBe('pending');
  });
});
