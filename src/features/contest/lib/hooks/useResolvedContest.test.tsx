import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Contest } from '../../contexts/contest/contestTypes';
import { useResolvedContest } from './useResolvedContest';

const useContestStoreMock = vi.fn();
const useContestSubscriptionMock = vi.fn();

vi.mock('@/contest/contexts/contest/ContestContext', () => ({
  useContestStore: () => useContestStoreMock(),
}));

vi.mock('../realtime', () => ({
  useContestSubscription: (contestId: string | null) => useContestSubscriptionMock(contestId),
}));

const contest: Contest = {
  id: 'contest-1',
  name: 'Bracket Bash',
  slug: 'bracket-bash',
  phase: 'set',
  entries: [],
  voters: [],
};

describe('useResolvedContest', () => {
  beforeEach(() => {
    useContestStoreMock.mockReset();
    useContestSubscriptionMock.mockReset();
  });

  it('returns the matched contest and subscribes by route param', () => {
    useContestStoreMock.mockReturnValue({
      contests: [contest],
      loading: false,
    });

    const { result } = renderHook(() => useResolvedContest('bracket-bash'));

    expect(useContestSubscriptionMock).toHaveBeenCalledWith('bracket-bash');
    expect(result.current.status).toBe('ready');
    expect(result.current.contest).toEqual(contest);
  });

  it('returns loading while the contest store is still fetching', () => {
    useContestStoreMock.mockReturnValue({
      contests: [],
      loading: true,
    });

    const { result } = renderHook(() => useResolvedContest('contest-1'));

    expect(result.current.status).toBe('loading');
    expect(result.current.contest).toBeNull();
  });

  it('returns missing when no contest matches the route param', () => {
    useContestStoreMock.mockReturnValue({
      contests: [],
      loading: false,
    });

    const { result } = renderHook(() => useResolvedContest('missing-contest'));

    expect(result.current.status).toBe('missing');
    expect(result.current.contest).toBeNull();
  });
});
