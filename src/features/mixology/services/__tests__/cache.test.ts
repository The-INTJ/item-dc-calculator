import { beforeEach, describe, expect, it } from 'vitest';
import { getCachedContestSnapshot, setCachedContest } from '../cache';
import type { Contest } from '../../types';

const contest: Contest = {
  id: 'contest-1',
  name: 'Cache Test',
  slug: 'cache-test',
  phase: 'shake',
  drinks: [],
  judges: [],
  scores: [],
};

describe('mixology data cache', () => {
  beforeEach(() => {
    setCachedContest(null);
  });

  // Assumption: cached contest data should be available to the UI while revalidation happens.
  it('returns the cached contest snapshot after setting', () => {
    const now = Date.now();
    setCachedContest(contest, now);

    const snapshot = getCachedContestSnapshot();

    expect(snapshot.contest).toEqual(contest);
    expect(snapshot.updatedAt).toBe(now);
  });

  // Assumption: clearing the cache should fully reset cached contest state for safety.
  it('clears the cached contest snapshot', () => {
    setCachedContest(contest, Date.now());
    setCachedContest(null);

    const snapshot = getCachedContestSnapshot();

    expect(snapshot.contest).toBeNull();
    expect(snapshot.updatedAt).toBeNull();
  });
});
