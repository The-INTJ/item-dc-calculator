import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../../../contexts/auth/types';
import type { Contest } from '../../../contexts/contest/contestTypes';
import { buildHomepageView } from '../buildHomepageView';

function makeContest(overrides: Partial<Contest> = {}): Contest {
  return {
    id: 'contest-1',
    name: 'Mixology Test 1',
    slug: 'mixology-test-1',
    contestants: [],
    voters: [],
    rounds: [],
    ...overrides,
  };
}

const voterProfile: UserProfile = { displayName: 'Voter Vee', role: 'voter' };
const adminProfile: UserProfile = { displayName: 'Admin Ann', role: 'admin' };

describe('buildHomepageView', () => {
  it('returns no welcome and no banner for an anonymous user, even with active contests', () => {
    const view = buildHomepageView({
      contests: [makeContest({ defaultContest: true })],
      user: null,
      role: null,
      visitedContestIds: new Set(),
    });

    expect(view.welcome).toBeNull();
    expect(view.liveBanner).toBeNull();
    expect(view.contests).toHaveLength(1);
    expect(view.contests[0].statusBadge).toBeNull();
  });

  it('hides the live banner for a voter who has not visited any contest', () => {
    const view = buildHomepageView({
      contests: [makeContest({ defaultContest: true })],
      user: voterProfile,
      role: 'voter',
      visitedContestIds: new Set(),
    });

    expect(view.welcome).toEqual({ displayName: 'Voter Vee' });
    expect(view.liveBanner).toBeNull();
    expect(view.contests[0].statusBadge).toBeNull();
  });

  it('shows the live banner with a "Go to ..." CTA after a voter has visited a contest', () => {
    const view = buildHomepageView({
      contests: [makeContest()],
      user: voterProfile,
      role: 'voter',
      visitedContestIds: new Set(['contest-1']),
    });

    expect(view.liveBanner).toEqual({
      contestId: 'contest-1',
      contestName: 'Mixology Test 1',
      ctaLabel: 'Go to Mixology Test 1',
      ctaHref: '/contest/contest-1',
      roundCount: 0,
      entryCount: 0,
    });
  });

  it('picks the most recently visited contest when multiple have been visited', () => {
    const view = buildHomepageView({
      contests: [
        makeContest({ id: 'a', name: 'Alpha' }),
        makeContest({ id: 'b', name: 'Bravo' }),
      ],
      user: voterProfile,
      role: 'voter',
      // Insertion order: 'a' first, 'b' last (most recent)
      visitedContestIds: new Set(['a', 'b']),
    });

    expect(view.liveBanner?.contestId).toBe('b');
    expect(view.liveBanner?.ctaLabel).toBe('Go to Bravo');
  });

  it('skips visited contests that are no longer in the contest list', () => {
    const view = buildHomepageView({
      contests: [makeContest({ id: 'a', name: 'Alpha' })],
      user: voterProfile,
      role: 'voter',
      visitedContestIds: new Set(['a', 'deleted-id']),
    });

    expect(view.liveBanner?.contestId).toBe('a');
  });

  it('renders status badges for admins and gates the banner the same way as voters', () => {
    const visited = buildHomepageView({
      contests: [makeContest({ defaultContest: true })],
      user: adminProfile,
      role: 'admin',
      visitedContestIds: new Set(['contest-1']),
    });

    expect(visited.contests[0].statusBadge).toEqual({ label: 'Active', variant: 'active' });
    expect(visited.liveBanner?.contestId).toBe('contest-1');

    const unvisited = buildHomepageView({
      contests: [makeContest({ defaultContest: true })],
      user: adminProfile,
      role: 'admin',
      visitedContestIds: new Set(),
    });

    expect(unvisited.contests[0].statusBadge).toEqual({ label: 'Active', variant: 'active' });
    expect(unvisited.liveBanner).toBeNull();
  });

  it('marks contests without entries or rounds as pending for admins', () => {
    const view = buildHomepageView({
      contests: [makeContest()],
      user: adminProfile,
      role: 'admin',
      visitedContestIds: new Set(),
    });

    expect(view.contests[0].statusBadge).toEqual({ label: 'Pending', variant: 'pending' });
  });

  it('builds initials and href for each row', () => {
    const view = buildHomepageView({
      contests: [makeContest({ id: 'c-2', name: 'Friday Night Cocktails' })],
      user: voterProfile,
      role: 'voter',
      visitedContestIds: new Set(),
    });

    expect(view.contests[0]).toMatchObject({
      id: 'c-2',
      href: '/contest/c-2',
      initials: 'FN',
    });
  });
});
