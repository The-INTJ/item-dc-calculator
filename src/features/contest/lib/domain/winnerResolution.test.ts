import { describe, expect, it } from 'vitest';
import { getEntryAverageRaw, resolveMatchupWinner } from './winnerResolution';
import type { Entry } from '../../contexts/contest/contestTypes';

function entry(id: string, sumScore: number, voteCount: number): Entry {
  return { id, contestantId: `c-${id}`, matchupId: 'm-1', name: id, sumScore, voteCount };
}

describe('getEntryAverageRaw', () => {
  it('returns the unrounded average', () => {
    expect(getEntryAverageRaw(entry('a', 37, 5))).toBeCloseTo(7.4, 10);
  });

  it('returns null with no votes', () => {
    expect(getEntryAverageRaw(entry('a', 0, 0))).toBeNull();
    expect(getEntryAverageRaw({ id: 'a', contestantId: 'c', matchupId: 'm', name: 'a' })).toBeNull();
  });
});

describe('resolveMatchupWinner', () => {
  it('resolves the higher raw average as winner', () => {
    const result = resolveMatchupWinner({ entries: [entry('a', 40, 5), entry('b', 30, 5)] });
    expect(result).toEqual({ ok: true, winnerEntryId: 'a' });
  });

  it('resolves 7.4 vs 6.6 as a win, not a rounded tie', () => {
    // Both display as 7 (Math.round), but raw averages differ — the old
    // rounded comparison would have blocked seeding on a phantom tie.
    const result = resolveMatchupWinner({ entries: [entry('a', 37, 5), entry('b', 33, 5)] });
    expect(result).toEqual({ ok: true, winnerEntryId: 'a' });
  });

  it('reports an exact tie', () => {
    const result = resolveMatchupWinner({ entries: [entry('a', 35, 5), entry('b', 21, 3)] });
    expect(result).toEqual({ ok: false, reason: 'tied' });
  });

  it('treats float-noise equality as a tie', () => {
    // 0.3/1 vs (0.1+0.2)/1 — classic float artifact, must not produce a winner.
    const result = resolveMatchupWinner({
      entries: [entry('a', 0.3, 1), entry('b', 0.1 + 0.2, 1)],
    });
    expect(result).toEqual({ ok: false, reason: 'tied' });
  });

  it('reports no-scores when nothing has votes', () => {
    const result = resolveMatchupWinner({ entries: [entry('a', 0, 0), entry('b', 0, 0)] });
    expect(result).toEqual({ ok: false, reason: 'no-scores' });
  });

  it('wins by default when only one entry has votes', () => {
    const result = resolveMatchupWinner({ entries: [entry('a', 0, 0), entry('b', 12, 2)] });
    expect(result).toEqual({ ok: true, winnerEntryId: 'b' });
  });

  it('auto-wins a single-entry bye even without votes', () => {
    const result = resolveMatchupWinner({ entries: [entry('solo', 0, 0)] });
    expect(result).toEqual({ ok: true, winnerEntryId: 'solo' });
  });

  it('reports no-entries for an empty matchup', () => {
    expect(resolveMatchupWinner({ entries: [] })).toEqual({ ok: false, reason: 'no-entries' });
  });
});
