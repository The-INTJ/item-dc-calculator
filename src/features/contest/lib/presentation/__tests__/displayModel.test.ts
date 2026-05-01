import { describe, expect, it } from 'vitest';
import type { Contest, Entry, Matchup } from '../../../contexts/contest/contestTypes';
import { buildDisplayModel } from '../displayModel';

function entry(id: string, contestantId: string, name: string, sumScore = 0, voteCount = 0): Entry {
  return { id, contestantId, matchupId: '', name, sumScore, voteCount };
}

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

    const model = buildDisplayModel(contest, matchups);

    expect(model.contestKind).toBe('generic');
    expect(model.activeRoundId).toBe('r1');
    expect(model.activeRoundName).toBe('Semifinal');
    expect(model.nextRoundName).toBe('Final');
    expect(model.activeShakeMatchup?.matchupId).toBe('m-2');
    expect(model.featuredMatchup?.matchupId).toBe('m-2');
    expect(model.featuredMatchupMode).toBe('shake');
    expect(model.totalRounds).toBe(2);
    expect(model.rounds[0].status).toBe('active');
    expect(model.rounds[0].matchups).toHaveLength(2);
    expect(model.rounds[0].matchups[0]).toMatchObject({
      matchupId: 'm-1',
      phase: 'scored',
      winnerId: 'e1',
      contestantA: { id: 'e1', score: 10, scoreSignature: 'e1:20:2', isWinner: true },
      contestantB: { id: 'e2', score: 5, isWinner: false },
      slotIndex: 0,
    });
    expect(model.rounds[0].matchups[1]).toMatchObject({
      matchupId: 'm-2',
      phase: 'shake',
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
      contestants: [],
      voters: [],
    };
    const matchups: Matchup[] = [
      {
        id: 'm-r1-0',
        contestId: 'contest-f',
        roundId: 'r1',
        slotIndex: 0,
        entries: [entry('x', 'cX', 'X'), entry('y', 'cY', 'Y')],
        phase: 'scored',
        winnerEntryId: 'x',
      },
      {
        id: 'm-r2-0',
        contestId: 'contest-f',
        roundId: 'r2',
        slotIndex: 0,
        entries: [entry('x2', 'cX', 'X'), entry('z', 'cZ', 'Z')],
        phase: 'shake',
      },
    ];

    const model = buildDisplayModel(contest, matchups);
    expect(model.activeRoundId).toBe('r2');
    expect(model.isFinalRoundActive).toBe(true);
  });

  it('uses mixology kind and standby featured mode when no matchup is shaking', () => {
    const contest: Contest = {
      id: 'contest-s',
      name: 'Standby Bar',
      slug: 'standby-bar',
      config: {
        topic: 'Mixology',
        entryLabel: 'Drink',
        entryLabelPlural: 'Drinks',
        contestantLabel: 'Mixologist',
        contestantLabelPlural: 'Mixologists',
        attributes: [],
      },
      rounds: [{ id: 'r1', name: 'Round 1' }],
      contestants: [
        { id: 'cA', displayName: 'A' },
        { id: 'cB', displayName: 'B' },
      ],
      voters: [],
    };
    const matchups: Matchup[] = [
      {
        id: 'm-1',
        contestId: 'contest-s',
        roundId: 'r1',
        slotIndex: 0,
        entries: [entry('e1', 'cA', 'Spritz'), entry('e2', 'cB', 'Sour')],
        phase: 'set',
      },
    ];

    const model = buildDisplayModel(contest, matchups);

    expect(model.contestKind).toBe('mixology');
    expect(model.activeShakeMatchup).toBeNull();
    expect(model.featuredMatchup?.matchupId).toBe('m-1');
    expect(model.featuredMatchupMode).toBe('standby');
  });
});
