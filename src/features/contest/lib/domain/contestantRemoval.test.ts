import { describe, expect, it } from 'vitest';
import { planContestantRemoval } from './contestantRemoval';
import type { Entry, Matchup } from '../../contexts/contest/contestTypes';

function entry(id: string, contestantId: string, matchupId: string, sumScore = 0, voteCount = 0): Entry {
  return { id, contestantId, matchupId, name: id, sumScore, voteCount };
}

function matchup(id: string, overrides: Partial<Matchup> = {}): Matchup {
  return {
    id,
    contestId: 'contest-1',
    roundId: 'round-1',
    slotIndex: 0,
    phase: 'shake',
    entries: [],
    ...overrides,
  } as Matchup;
}

describe('planContestantRemoval', () => {
  it('ignores matchups the contestant is not in', () => {
    const plan = planContestantRemoval('c-gone', [
      matchup('m-1', { entries: [entry('e-1', 'c-a', 'm-1'), entry('e-2', 'c-b', 'm-1')] }),
    ]);
    expect(plan).toEqual({ updates: [], deletes: [], purgedEntryIds: [] });
  });

  it('collapses a 2-entry matchup into a scored bye for the survivor', () => {
    const survivor = entry('e-stay', 'c-stay', 'm-1', 12, 2);
    const plan = planContestantRemoval('c-gone', [
      matchup('m-1', {
        phase: 'shake',
        entries: [entry('e-gone', 'c-gone', 'm-1', 20, 2), survivor],
      }),
    ]);

    expect(plan.purgedEntryIds).toEqual(['e-gone']);
    expect(plan.deletes).toEqual([]);
    expect(plan.updates).toEqual([
      {
        matchupId: 'm-1',
        entries: [survivor],
        phase: 'scored',
        winnerEntryId: 'e-stay',
      },
    ]);
  });

  it('reassigns the win when the removed contestant had won a scored matchup', () => {
    const survivor = entry('e-stay', 'c-stay', 'm-1', 12, 2);
    const plan = planContestantRemoval('c-gone', [
      matchup('m-1', {
        phase: 'scored',
        winnerEntryId: 'e-gone',
        entries: [entry('e-gone', 'c-gone', 'm-1', 30, 3), survivor],
      }),
    ]);

    expect(plan.updates[0].winnerEntryId).toBe('e-stay');
    expect(plan.updates[0].phase).toBe('scored');
  });

  it('deletes a matchup where the removed contestant was the lone (bye) entry', () => {
    const plan = planContestantRemoval('c-gone', [
      matchup('m-bye', { phase: 'scored', entries: [entry('e-gone', 'c-gone', 'm-bye')] }),
    ]);
    expect(plan.deletes).toEqual(['m-bye']);
    expect(plan.updates).toEqual([]);
    expect(plan.purgedEntryIds).toEqual(['e-gone']);
  });

  it('cascades across every matchup they appear in (multi-round)', () => {
    const plan = planContestantRemoval('c-gone', [
      matchup('m-r1', {
        roundId: 'round-1',
        phase: 'scored',
        winnerEntryId: 'e-r1-gone',
        entries: [entry('e-r1-gone', 'c-gone', 'm-r1', 40, 5), entry('e-r1-stay', 'c-a', 'm-r1', 30, 5)],
      }),
      matchup('m-r2', {
        roundId: 'round-2',
        phase: 'set',
        entries: [entry('e-r2-gone', 'c-gone', 'm-r2'), entry('e-r2-stay', 'c-b', 'm-r2')],
      }),
    ]);

    expect(plan.purgedEntryIds).toEqual(['e-r1-gone', 'e-r2-gone']);
    expect(plan.updates).toHaveLength(2);
    // Round-1 win reassigned to the survivor; round-2 collapses to a bye.
    expect(plan.updates[0]).toMatchObject({ matchupId: 'm-r1', winnerEntryId: 'e-r1-stay' });
    expect(plan.updates[1]).toMatchObject({
      matchupId: 'm-r2',
      phase: 'scored',
      winnerEntryId: 'e-r2-stay',
    });
  });
});
