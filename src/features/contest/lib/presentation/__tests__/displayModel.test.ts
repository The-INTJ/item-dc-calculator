import { describe, expect, it } from 'vitest';
import type { Contest } from '../../../contexts/contest/contestTypes';
import { buildDisplayModel } from '../displayModel';

describe('buildDisplayModel', () => {
  it('derives active round data, scores, and leader styling from a contest', () => {
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
        { id: 'entry-1', name: 'North', slug: 'north', description: '', round: 'round-1', submittedBy: 'A', sumScore: 18, voteCount: 2 },
        { id: 'entry-2', name: 'South', slug: 'south', description: '', round: 'round-1', submittedBy: 'B', sumScore: 14, voteCount: 2 },
        { id: 'entry-3', name: 'East', slug: 'east', description: '', round: 'round-2', submittedBy: 'C', sumScore: 9, voteCount: 1 },
        { id: 'entry-4', name: 'West', slug: 'west', description: '', round: 'round-2', submittedBy: 'D', sumScore: 9, voteCount: 1 },
      ],
      voters: [],
    };

    const model = buildDisplayModel(contest);

    expect(model.contestId).toBe('contest-1');
    expect(model.activeRoundId).toBe('round-1');
    expect(model.activeRoundName).toBe('Semifinal');
    expect(model.nextRoundName).toBe('Final');
    expect(model.totalRounds).toBe(2);
    expect(model.rounds).toHaveLength(2);

    expect(model.rounds[0]).toMatchObject({
      id: 'round-1',
      status: 'active',
      isActive: true,
    });
    expect(model.rounds[0].matchups[0]).toMatchObject({
      winnerId: 'entry-1',
      contestantA: { id: 'entry-1', score: 9, isWinner: true },
      contestantB: { id: 'entry-2', score: 7, isWinner: false },
    });

    expect(model.rounds[1]).toMatchObject({
      id: 'round-2',
      status: 'upcoming',
      isActive: false,
    });
    expect(model.rounds[1].matchups[0].winnerId).toBeNull();
  });
});