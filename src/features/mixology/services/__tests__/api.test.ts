import { describe, expect, it } from 'vitest';
import { extractCurrentContest } from '../api';
import type { Contest } from '../../types';

describe('extractCurrentContest', () => {
  // Assumption: the contests API response must provide currentContest when the UI needs a default contest.
  it('returns currentContest when present', () => {
    const contest: Contest = {
      id: 'contest-1',
      name: 'Cascadia Classic',
      slug: 'cascadia-classic',
      phase: 'shake',
      entries: [],
      judges: [],
      scores: [],
    };

    expect(extractCurrentContest({ currentContest: contest })).toEqual(contest);
  });

  // Assumption: missing or invalid currentContest should be treated as null to avoid stale UI.
  it('returns null when currentContest is missing', () => {
    expect(extractCurrentContest({ contests: [] })).toBeNull();
  });
});
