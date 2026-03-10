import { describe, expect, it } from 'vitest';
import type { Contest } from '../../contexts/contest/contestTypes';
import {
  getActiveRoundId,
  getEntriesForRound,
  getEntryScore,
  getFutureRoundId,
  getRoundStatus,
} from './contestGetters';

const contest: Contest = {
  id: 'contest-1',
  name: 'Bracket Bash',
  slug: 'bracket-bash',
  phase: 'shake',
  activeRoundId: 'round-2',
  rounds: [
    { id: 'round-1', name: 'Qualifiers', state: 'scored' },
    { id: 'round-2', name: 'Semifinals', state: 'shake' },
    { id: 'round-3', name: 'Finals', state: 'set' },
  ],
  entries: [
    {
      id: 'entry-1',
      name: 'North',
      slug: 'north',
      description: '',
      round: 'round-1',
      submittedBy: 'A',
      sumScore: 12,
      voteCount: 2,
    },
    {
      id: 'entry-2',
      name: 'South',
      slug: 'south',
      description: '',
      round: 'Semifinals',
      submittedBy: 'B',
      sumScore: 18,
      voteCount: 3,
    },
    {
      id: 'entry-3',
      name: 'East',
      slug: 'east',
      description: '',
      round: 'round-2',
      submittedBy: 'C',
      sumScore: 15,
      voteCount: 3,
    },
  ],
  voters: [],
};

describe('contestGetters', () => {
  it('derives active and future rounds from contest state', () => {
    expect(getActiveRoundId(contest)).toBe('round-2');
    expect(getFutureRoundId(contest)).toBe('round-3');
  });

  it('matches entries by round id or legacy round name', () => {
    expect(getEntriesForRound(contest, 'round-2').map((entry) => entry.id)).toEqual([
      'entry-2',
      'entry-3',
    ]);
  });

  it('computes round status relative to the active round', () => {
    expect(getRoundStatus(contest, 'round-1')).toBe('closed');
    expect(getRoundStatus(contest, 'round-2')).toBe('active');
    expect(getRoundStatus(contest, 'round-3')).toBe('upcoming');
  });

  it('calculates rounded entry scores from aggregates', () => {
    expect(getEntryScore(contest.entries[0])).toBe(6);
    expect(getEntryScore({ ...contest.entries[0], voteCount: 0 })).toBeNull();
  });
});
