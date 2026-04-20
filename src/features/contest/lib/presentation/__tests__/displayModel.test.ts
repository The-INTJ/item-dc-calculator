import { describe, expect, it } from 'vitest';
import type { Contest, Matchup } from '../../../contexts/contest/contestTypes';
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

    // Round 0: bracket expects 2 matchups for 2 rounds; first matchup has real entries
    expect(model.rounds[0]).toMatchObject({
      id: 'round-1',
      status: 'active',
      isActive: true,
      expectedMatchupCount: 2,
      roundIndex: 0,
    });
    expect(model.rounds[0].matchups).toHaveLength(2);
    expect(model.rounds[0].matchups[0]).toMatchObject({
      winnerId: 'entry-1',
      contestantA: { id: 'entry-1', score: 9, isWinner: true },
      contestantB: { id: 'entry-2', score: 7, isWinner: false },
      slotIndex: 0,
      sourceMatchups: null,
    });
    // Second matchup is a TBD slot (no entries assigned)
    expect(model.rounds[0].matchups[1].contestantA.name).toBe('TBD');
    expect(model.rounds[0].matchups[1].contestantB.name).toBe('TBD');

    // Round 1 (final): manual entries override winner propagation
    expect(model.rounds[1]).toMatchObject({
      id: 'round-2',
      status: 'upcoming',
      isActive: false,
      expectedMatchupCount: 1,
      roundIndex: 1,
    });
    expect(model.rounds[1].matchups[0].winnerId).toBeNull();
    expect(model.rounds[1].matchups[0].contestantA.name).toBe('East');
    expect(model.rounds[1].matchups[0].contestantB.name).toBe('West');

    // Bracket structure
    expect(model.bracketStructure.totalRounds).toBe(2);
    expect(model.bracketStructure.totalContestants).toBe(4);
    expect(model.isFinalRoundActive).toBe(false);
  });

  it('propagates winners to unfilled next-round slots', () => {
    const contest: Contest = {
      id: 'contest-2',
      name: 'Propagation Test',
      slug: 'propagation-test',
      phase: 'shake',
      activeRoundId: 'r1',
      rounds: [
        { id: 'r1', name: 'Round 1', state: 'scored' },
        { id: 'r2', name: 'Final', state: 'shake' },
      ],
      entries: [
        { id: 'e1', name: 'Alpha', slug: 'alpha', description: '', round: 'r1', submittedBy: 'A', sumScore: 20, voteCount: 2 },
        { id: 'e2', name: 'Beta', slug: 'beta', description: '', round: 'r1', submittedBy: 'B', sumScore: 10, voteCount: 2 },
        // No entries manually assigned to r2 — should propagate winner from r1
      ],
      voters: [],
    };

    const model = buildDisplayModel(contest);

    // Round 1 (final): one slot expected, no manual entries
    // Winner from r1 matchup 0 is e1 (Alpha, score 10 > Beta score 5)
    // sourceMatchups[0] = matchup 0 from r1, sourceMatchups[1] = matchup 1 from r1
    const finalMatchup = model.rounds[1].matchups[0];
    expect(finalMatchup.contestantA.name).toBe('Alpha'); // propagated winner from matchup 0
    expect(finalMatchup.contestantB.name).toBe('TBD'); // matchup 1 in r1 is all TBD, no winner
  });

  it('drives rounds, matchupIds, and phases from a stored matchup collection', () => {
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
    expect(model.rounds[0].status).toBe('active');
    expect(model.rounds[0].matchups).toHaveLength(2);
    expect(model.rounds[0].matchups[0]).toMatchObject({
      matchupId: 'm-1',
      phase: 'scored',
      winnerId: 'e1',
      contestantA: { id: 'e1', isWinner: true },
    });
    expect(model.rounds[0].matchups[1]).toMatchObject({
      matchupId: 'm-2',
      phase: 'shake',
    });
    expect(model.phase).toBe('shake');
    expect(model.rounds[1].status).toBe('pending');
  });

  it('sets isFinalRoundActive when active round is the last', () => {
    const contest: Contest = {
      id: 'contest-3',
      name: 'Final Active',
      slug: 'final-active',
      phase: 'shake',
      activeRoundId: 'r2',
      rounds: [
        { id: 'r1', name: 'Semi', state: 'scored' },
        { id: 'r2', name: 'Final', state: 'shake' },
      ],
      entries: [],
      voters: [],
    };

    const model = buildDisplayModel(contest);
    expect(model.isFinalRoundActive).toBe(true);
  });
});