import { describe, expect, it } from 'vitest';
import type { Contest, Entry } from '../../contexts/contest/contestTypes';
import {
  getContestRounds,
  getEntryScore,
  getRoundById,
  getRoundLabel,
} from './contestGetters';

const contest: Contest = {
  id: 'contest-1',
  name: 'Bracket Bash',
  slug: 'bracket-bash',
  rounds: [
    { id: 'round-1', name: 'Qualifiers' },
    { id: 'round-2', name: 'Semifinals' },
    { id: 'round-3', name: 'Finals' },
  ],
  contestants: [],
  voters: [],
};

const sampleEntry: Entry = {
  id: 'entry-1',
  contestantId: 'c-1',
  matchupId: 'matchup-1',
  name: 'North',
  sumScore: 12,
  voteCount: 2,
};

describe('contestGetters', () => {
  it('returns contest rounds, defaulting to empty', () => {
    expect(getContestRounds(contest)).toHaveLength(3);
    expect(getContestRounds({ ...contest, rounds: undefined })).toEqual([]);
  });

  it('finds a round by id', () => {
    expect(getRoundById(contest, 'round-2')?.name).toBe('Semifinals');
    expect(getRoundById(contest, 'missing')).toBeNull();
    expect(getRoundById(contest, null)).toBeNull();
  });

  it('labels a round by its index', () => {
    expect(getRoundLabel(contest, 'round-2')).toBe('Round 2');
    expect(getRoundLabel(contest, null)).toBe('Unassigned');
    expect(getRoundLabel(contest, 'missing')).toBe('Unassigned');
  });

  it('calculates rounded entry scores from aggregates', () => {
    expect(getEntryScore(sampleEntry)).toBe(6);
    expect(getEntryScore({ ...sampleEntry, voteCount: 0 })).toBeNull();
  });
});
