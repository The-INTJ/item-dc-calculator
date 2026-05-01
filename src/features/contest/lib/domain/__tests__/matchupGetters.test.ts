import { describe, expect, it } from 'vitest';
import type { ContestRound, Entry, Matchup } from '../../../contexts/contest/contestTypes';
import {
  getActiveRoundIdFromMatchups,
  getComputedRoundStatus,
  getEntriesInMatchup,
  getMatchupsForRound,
  getRoundWinnerEntryIds,
} from '../matchupGetters';

function makeRound(id: string, adminOverride?: 'active' | 'closed' | null): ContestRound {
  return { id, name: id, adminOverride: adminOverride ?? null };
}

function makeEntry(id: string, name = id, contestantId = `c-${id}`): Entry {
  return { id, contestantId, matchupId: 'm1', name };
}

function makeMatchup(
  id: string,
  roundId: string,
  phase: Matchup['phase'],
  opts: Partial<Matchup> = {},
): Matchup {
  return {
    id,
    contestId: 'c1',
    roundId,
    slotIndex: 0,
    entries: [makeEntry('e1'), makeEntry('e2')],
    phase,
    winnerEntryId: null,
    ...opts,
  };
}

describe('getMatchupsForRound', () => {
  it('filters by roundId', () => {
    const matchups = [
      makeMatchup('m1', 'r1', 'set'),
      makeMatchup('m2', 'r2', 'set'),
      makeMatchup('m3', 'r1', 'shake'),
    ];
    expect(getMatchupsForRound(matchups, 'r1').map((m) => m.id)).toEqual(['m1', 'm3']);
  });
});

describe('getComputedRoundStatus', () => {
  const round = makeRound('r1');

  it("returns 'pending' when no matchups exist", () => {
    expect(getComputedRoundStatus(round, [])).toBe('pending');
  });

  it("returns 'upcoming' when all matchups are in 'set'", () => {
    const matchups = [makeMatchup('m1', 'r1', 'set'), makeMatchup('m2', 'r1', 'set')];
    expect(getComputedRoundStatus(round, matchups)).toBe('upcoming');
  });

  it("returns 'closed' when all matchups are 'scored'", () => {
    const matchups = [makeMatchup('m1', 'r1', 'scored'), makeMatchup('m2', 'r1', 'scored')];
    expect(getComputedRoundStatus(round, matchups)).toBe('closed');
  });

  it("returns 'active' for mixed phases", () => {
    const matchups = [makeMatchup('m1', 'r1', 'shake'), makeMatchup('m2', 'r1', 'set')];
    expect(getComputedRoundStatus(round, matchups)).toBe('active');
  });

  it("honors adminOverride === 'closed'", () => {
    const overridden = makeRound('r1', 'closed');
    const matchups = [makeMatchup('m1', 'r1', 'shake')];
    expect(getComputedRoundStatus(overridden, matchups)).toBe('closed');
  });

  it("honors adminOverride === 'active'", () => {
    const overridden = makeRound('r1', 'active');
    const matchups = [makeMatchup('m1', 'r1', 'scored')];
    expect(getComputedRoundStatus(overridden, matchups)).toBe('active');
  });

  it('ignores matchups from other rounds', () => {
    const matchups = [makeMatchup('m1', 'r2', 'scored'), makeMatchup('m2', 'r2', 'scored')];
    expect(getComputedRoundStatus(round, matchups)).toBe('pending');
  });
});

describe('getRoundWinnerEntryIds', () => {
  it('returns winners only from scored matchups', () => {
    const matchups = [
      makeMatchup('m1', 'r1', 'scored', { winnerEntryId: 'e1' }),
      makeMatchup('m2', 'r1', 'shake', { winnerEntryId: 'e2' }),
      makeMatchup('m3', 'r1', 'scored', { winnerEntryId: null }),
    ];
    expect(getRoundWinnerEntryIds(matchups)).toEqual(['e1']);
  });
});

describe('getActiveRoundIdFromMatchups', () => {
  it('picks the first active round', () => {
    const rounds = [makeRound('r1'), makeRound('r2'), makeRound('r3')];
    const matchups = [
      makeMatchup('m1', 'r1', 'scored'),
      makeMatchup('m2', 'r2', 'shake'),
      makeMatchup('m3', 'r3', 'set'),
    ];
    expect(getActiveRoundIdFromMatchups(rounds, matchups)).toBe('r2');
  });

  it('falls back to the first upcoming round when none are active', () => {
    const rounds = [makeRound('r1'), makeRound('r2')];
    const matchups = [makeMatchup('m1', 'r1', 'scored'), makeMatchup('m2', 'r2', 'set')];
    expect(getActiveRoundIdFromMatchups(rounds, matchups)).toBe('r2');
  });

  it('returns null when no rounds are active or upcoming', () => {
    const rounds = [makeRound('r1')];
    const matchups = [makeMatchup('m1', 'r1', 'scored')];
    expect(getActiveRoundIdFromMatchups(rounds, matchups)).toBeNull();
  });
});

describe('getEntriesInMatchup', () => {
  it('returns the matchup entries directly', () => {
    const matchup = makeMatchup('m1', 'r1', 'set', {
      entries: [makeEntry('eA', 'A'), makeEntry('eC', 'C')],
    });
    expect(getEntriesInMatchup(matchup).map((e) => e.name)).toEqual(['A', 'C']);
  });

  it('returns empty for missing entries field', () => {
    const matchup = makeMatchup('m1', 'r1', 'set');
    matchup.entries = [];
    expect(getEntriesInMatchup(matchup)).toEqual([]);
  });
});
