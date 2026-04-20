import { describe, it, expect } from 'vitest';
import type { Contest } from '../../contexts/contest/contestTypes';
import { getUserContestRole } from './userContestState';

function makeContest(voters: Contest['voters'] = []): Contest {
  return {
    id: 'c1',
    name: 'Test',
    slug: 'test',
    entries: [],
    voters,
  };
}

describe('getUserContestRole', () => {
  it('returns spectator when userId is null', () => {
    expect(getUserContestRole(null, makeContest())).toBe('spectator');
  });

  it('returns spectator when user is not in voters', () => {
    expect(getUserContestRole('u1', makeContest())).toBe('spectator');
  });

  it('returns voter when user has voter role', () => {
    const contest = makeContest([{ id: 'u1', displayName: 'Alice', role: 'voter' }]);
    expect(getUserContestRole('u1', contest)).toBe('voter');
  });

  it('returns voter when user has admin role', () => {
    const contest = makeContest([{ id: 'u1', displayName: 'Admin', role: 'admin' }]);
    expect(getUserContestRole('u1', contest)).toBe('voter');
  });

  it('returns contestant when user has competitor role', () => {
    const contest = makeContest([{ id: 'u1', displayName: 'Bob', role: 'competitor' }]);
    expect(getUserContestRole('u1', contest)).toBe('contestant');
  });
});
