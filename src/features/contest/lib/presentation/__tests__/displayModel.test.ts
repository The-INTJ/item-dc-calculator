import { describe, expect, it } from 'vitest';
import type { Contest, Matchup } from '../../../contexts/contest/contestTypes';
import { buildDisplayModel } from '../displayModel';

describe('buildDisplayModel', () => {
  it('drives rounds, matchupIds, scores, and phases from the matchup collection', () => {
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

    const model = buildDisplayModel(contest, matchups);

    expect(model.activeRoundId).toBe('r1');
    expect(model.activeRoundName).toBe('Semifinal');
    expect(model.nextRoundName).toBe('Final');
    expect(model.totalRounds).toBe(2);
    expect(model.rounds[0].status).toBe('active');
    expect(model.rounds[0].matchups).toHaveLength(2);
    expect(model.rounds[0].matchups[0]).toMatchObject({
      matchupId: 'm-1',
      phase: 'scored',
      winnerId: 'e1',
      contestantA: { id: 'e1', score: 10, isWinner: true },
      contestantB: { id: 'e2', score: 5, isWinner: false },
      slotIndex: 0,
    });
    expect(model.rounds[0].matchups[1]).toMatchObject({
      matchupId: 'm-2',
      phase: 'shake',
      contestantA: { id: 'e3', name: 'Gamma' },
      contestantB: { id: 'e4', name: 'Delta' },
    });
    expect(model.phase).toBe('shake');
    expect(model.rounds[1].status).toBe('pending');
    expect(model.rounds[1].matchups[0].contestantA.name).toBe('TBD');

    expect(model.bracketStructure.totalRounds).toBe(2);
    expect(model.bracketStructure.totalContestants).toBe(4);
    expect(model.isFinalRoundActive).toBe(false);
  });

  it('derives active round name and finals flag when the final round is active', () => {
    const contest: Contest = {
      id: 'contest-f',
      name: 'Final Active',
      slug: 'final-active',
      rounds: [
        { id: 'r1', name: 'Semi' },
        { id: 'r2', name: 'Final' },
      ],
      entries: [],
      voters: [],
    };
    const matchups: Matchup[] = [
      {
        id: 'm-r1-0',
        contestId: 'contest-f',
        roundId: 'r1',
        slotIndex: 0,
        entryIds: ['x', 'y'],
        phase: 'scored',
        winnerEntryId: 'x',
      },
      {
        id: 'm-r2-0',
        contestId: 'contest-f',
        roundId: 'r2',
        slotIndex: 0,
        entryIds: ['x', 'z'],
        phase: 'shake',
      },
    ];

    const model = buildDisplayModel(contest, matchups);
    expect(model.activeRoundId).toBe('r2');
    expect(model.isFinalRoundActive).toBe(true);
  });
});
