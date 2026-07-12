import { describe, expect, it } from 'vitest';
import type { Contest, Entry, Matchup, MatchupPhase } from '../../../contexts/contest/contestTypes';
import { buildDisplayModel } from '../displayModel';

function entry(id: string, contestantId: string, name: string, sumScore = 0, voteCount = 0): Entry {
  return { id, contestantId, matchupId: '', name, sumScore, voteCount };
}

/**
 * Build a contest of N contestants across R rounds, with round 0 seeded the
 * way the seed route does it: sequential pairs, last contestant a bye.
 */
function makeField(
  contestantCount: number,
  roundCount: number,
  options: { seedFirstRound?: boolean; firstRoundPhase?: MatchupPhase } = {},
): { contest: Contest; matchups: Matchup[] } {
  const { seedFirstRound = true, firstRoundPhase = 'set' } = options;
  const contestants = Array.from({ length: contestantCount }, (_, i) => ({
    id: `c${i + 1}`,
    displayName: `C${i + 1}`,
  }));
  const rounds = Array.from({ length: roundCount }, (_, i) => ({
    id: `r${i + 1}`,
    name: `Round ${i + 1}`,
  }));
  const contest: Contest = {
    id: 'contest-field',
    name: 'Field',
    slug: 'field',
    rounds,
    contestants,
    voters: [],
  };

  const matchups: Matchup[] = [];
  if (seedFirstRound) {
    const pairCount = Math.floor(contestantCount / 2);
    for (let slot = 0; slot < pairCount; slot += 1) {
      const a = contestants[slot * 2];
      const b = contestants[slot * 2 + 1];
      matchups.push({
        id: `m-r1-${slot}`,
        contestId: contest.id,
        roundId: 'r1',
        slotIndex: slot,
        phase: firstRoundPhase,
        entries: [
          entry(`e-${a.id}`, a.id, a.displayName),
          entry(`e-${b.id}`, b.id, b.displayName),
        ],
      });
    }
    if (contestantCount % 2 === 1) {
      const solo = contestants[contestantCount - 1];
      matchups.push({
        id: `m-r1-bye`,
        contestId: contest.id,
        roundId: 'r1',
        slotIndex: pairCount,
        phase: 'scored',
        winnerEntryId: `e-${solo.id}`,
        entries: [entry(`e-${solo.id}`, solo.id, solo.displayName)],
      });
    }
  }
  return { contest, matchups };
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

  it('derives the bracket shape from real matchup counts — 5 contestants / 2 rounds (the off-grid bug case)', () => {
    const { contest, matchups } = makeField(5, 2);
    const model = buildDisplayModel(contest, matchups);

    // Round 0 actually holds 3 matchups (2 pairs + bye); the old power-of-2
    // structure allotted 2 and pushed the bye off the grid.
    expect(model.rounds[0].expectedMatchupCount).toBe(3);
    expect(model.rounds[0].matchups).toHaveLength(3);
    expect(model.rounds[0].matchups[2].isBye).toBe(true);
    expect(model.rounds[1].expectedMatchupCount).toBe(2);
    expect(model.gridRowCount).toBe(6);
    // The slot fed only by the bye has a single real source — no dangling
    // connector to a phantom feeder.
    expect(model.bracketStructure.rounds[1].slots[1].sourceMatchups).toEqual([2]);
    // A 2-round bracket over 5 contestants has no true final — nothing to
    // crown, no face-off swap.
    expect(model.champion).toBeNull();
    expect(model.faceOffRoundId).toBeNull();
  });

  it('sizes well-provisioned odd fields — 5 contestants / 3 rounds', () => {
    const { contest, matchups } = makeField(5, 3);
    const model = buildDisplayModel(contest, matchups);
    expect(model.rounds.map((r) => r.expectedMatchupCount)).toEqual([3, 2, 1]);
    expect(model.gridRowCount).toBe(6);
  });

  it('previews the shape from the contestant count before seeding', () => {
    const { contest } = makeField(7, 3, { seedFirstRound: false });
    const model = buildDisplayModel(contest, []);
    expect(model.rounds.map((r) => r.expectedMatchupCount)).toEqual([4, 2, 1]);
    expect(model.rounds[0].matchups.every((m) => m.contestantA.name === 'TBD')).toBe(true);
    expect(model.gridRowCount).toBe(8);
  });

  it('swaps in the face-off only for a true 1-matchup, non-bye active final', () => {
    const contest: Contest = {
      id: 'contest-fo',
      name: 'FO',
      slug: 'fo',
      rounds: [
        { id: 'r1', name: 'Semi' },
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
        id: 'm-r1-0',
        contestId: 'contest-fo',
        roundId: 'r1',
        slotIndex: 0,
        phase: 'scored',
        winnerEntryId: 'eA',
        entries: [entry('eA', 'cA', 'A'), entry('eB', 'cB', 'B')],
      },
      {
        id: 'm-r1-1',
        contestId: 'contest-fo',
        roundId: 'r1',
        slotIndex: 1,
        phase: 'scored',
        winnerEntryId: 'eC',
        entries: [entry('eC', 'cC', 'C'), entry('eD', 'cD', 'D')],
      },
      {
        id: 'm-r2-0',
        contestId: 'contest-fo',
        roundId: 'r2',
        slotIndex: 0,
        phase: 'shake',
        entries: [entry('eA2', 'cA', 'A'), entry('eC2', 'cC', 'C')],
      },
    ];

    const model = buildDisplayModel(contest, matchups);
    expect(model.faceOffRoundId).toBe('r2');
    expect(model.isFinalRoundActive).toBe(true);
  });

  it('crowns a champion from a trailing-bye final with no runner-up', () => {
    const contest: Contest = {
      id: 'contest-tb',
      name: 'TB',
      slug: 'tb',
      rounds: [
        { id: 'r1', name: 'Round 1' },
        { id: 'r2', name: 'Final' },
      ],
      contestants: [
        { id: 'cA', displayName: 'A' },
        { id: 'cB', displayName: 'B' },
      ],
      voters: [],
    };
    const matchups: Matchup[] = [
      {
        id: 'm-r1-0',
        contestId: 'contest-tb',
        roundId: 'r1',
        slotIndex: 0,
        phase: 'scored',
        winnerEntryId: 'eA',
        entries: [entry('eA', 'cA', 'A', 20, 2), entry('eB', 'cB', 'B', 10, 2)],
      },
      {
        id: 'm-r2-0',
        contestId: 'contest-tb',
        roundId: 'r2',
        slotIndex: 0,
        phase: 'scored',
        winnerEntryId: 'eA2',
        entries: [entry('eA2', 'cA', 'A')],
      },
    ];

    const model = buildDisplayModel(contest, matchups);
    expect(model.champion?.contestant.name).toContain('A');
    expect(model.champion?.runnerUp).toBeNull();
    // A bye final never swaps to the face-off panel.
    expect(model.faceOffRoundId).toBeNull();
  });

  it('never crowns from an under-provisioned "final" holding multiple matchups', () => {
    const { contest, matchups } = makeField(5, 2, { firstRoundPhase: 'scored' });
    // Score winners on the pairs so nothing is left ambiguous.
    matchups[0].winnerEntryId = matchups[0].entries[0].id;
    matchups[1].winnerEntryId = matchups[1].entries[0].id;
    // Round 2 seeded with 2 matchups (pair + bye), both scored.
    matchups.push(
      {
        id: 'm-r2-0',
        contestId: contest.id,
        roundId: 'r2',
        slotIndex: 0,
        phase: 'scored',
        winnerEntryId: 'e-c1-2',
        entries: [entry('e-c1-2', 'c1', 'C1'), entry('e-c3-2', 'c3', 'C3')],
      },
      {
        id: 'm-r2-1',
        contestId: contest.id,
        roundId: 'r2',
        slotIndex: 1,
        phase: 'scored',
        winnerEntryId: 'e-c5-2',
        entries: [entry('e-c5-2', 'c5', 'C5')],
      },
    );

    const model = buildDisplayModel(contest, matchups);
    expect(model.rounds[1].expectedMatchupCount).toBe(2);
    expect(model.champion).toBeNull();
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
