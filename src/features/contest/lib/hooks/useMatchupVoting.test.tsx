import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useMatchupVoting,
  VOTING_CLOSED_MESSAGE,
  VOTING_RACE_MESSAGE,
} from './useMatchupVoting';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';

const getScoresForUserMock = vi.fn();
const submitBallotMock = vi.fn();

vi.mock('../api/contestApi', () => ({
  contestApi: {
    getScoresForUser: (...args: unknown[]) => getScoresForUserMock(...args),
    submitBallot: (...args: unknown[]) => submitBallotMock(...args),
  },
}));

vi.mock('../../contexts/auth/AuthContext', () => ({
  useAuth: () => ({
    session: {
      sessionId: 'sess-1',
      status: 'authenticated',
      firebaseUid: 'voter-9',
      profile: { displayName: 'Vera Voter', role: 'voter' },
      createdAt: 0,
      updatedAt: 0,
    },
    role: 'voter',
    loading: false,
  }),
}));

const contest: Contest = {
  id: 'contest-1',
  name: 'Test',
  slug: 'test',
  config: {
    topic: 'Mixology',
    attributes: [{ id: 'taste', label: 'Taste', min: 0, max: 10 }],
  },
  contestants: [],
  voters: [],
};

function makeMatchup(phase: Matchup['phase']): Matchup {
  return {
    id: 'matchup-1',
    contestId: 'contest-1',
    roundId: 'round-1',
    slotIndex: 0,
    phase,
    entries: [
      { id: 'e-1', contestantId: 'c-1', matchupId: 'matchup-1', name: 'Paloma' },
      { id: 'e-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'Margarita' },
    ],
  };
}

describe('useMatchupVoting', () => {
  beforeEach(() => {
    getScoresForUserMock.mockReset();
    submitBallotMock.mockReset();
    getScoresForUserMock.mockResolvedValue({ success: true, data: [] });
  });

  it('exposes isMatchupOpen from the live matchup phase', () => {
    const open = renderHook(() => useMatchupVoting(contest, makeMatchup('shake')));
    expect(open.result.current.isMatchupOpen).toBe(true);

    const closed = renderHook(() => useMatchupVoting(contest, makeMatchup('scored')));
    expect(closed.result.current.isMatchupOpen).toBe(false);
  });

  it('pre-flight guards submit when the matchup is already closed (no network)', async () => {
    const { result } = renderHook(() => useMatchupVoting(contest, makeMatchup('scored')));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('closed');
    expect(result.current.message).toBe(VOTING_CLOSED_MESSAGE);
    expect(submitBallotMock).not.toHaveBeenCalled();
  });

  it('submits the whole ballot atomically on success', async () => {
    submitBallotMock.mockResolvedValue({ success: true, data: { scores: [] } });
    const { result } = renderHook(() => useMatchupVoting(contest, makeMatchup('shake')));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('success');
    expect(submitBallotMock).toHaveBeenCalledTimes(1);
    const [contestId, matchupId, body] = submitBallotMock.mock.calls[0];
    expect(contestId).toBe('contest-1');
    expect(matchupId).toBe('matchup-1');
    expect(body.scores).toHaveLength(2);
    expect(body.scores.map((s: { entryId: string }) => s.entryId).sort()).toEqual(['e-1', 'e-2']);
  });

  it('maps a MATCHUP_CLOSED rejection to the not-quite-in-time state', async () => {
    submitBallotMock.mockResolvedValue({
      success: false,
      error: 'Matchup is not open for scoring.',
      errorCode: 'MATCHUP_CLOSED',
    });
    const { result } = renderHook(() => useMatchupVoting(contest, makeMatchup('shake')));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('closed');
    expect(result.current.message).toBe(VOTING_RACE_MESSAGE);
  });

  it('surfaces other failures as a plain error without the Error: prefix', async () => {
    submitBallotMock.mockResolvedValue({ success: false, error: 'Server exploded' });
    const { result } = renderHook(() => useMatchupVoting(contest, makeMatchup('shake')));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('Server exploded');
  });

  it('returns to idle when the admin reopens a closed matchup', async () => {
    const { result, rerender } = renderHook(
      ({ matchup }: { matchup: Matchup }) => useMatchupVoting(contest, matchup),
      { initialProps: { matchup: makeMatchup('scored') } },
    );

    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.status).toBe('closed');

    rerender({ matchup: makeMatchup('shake') });
    await waitFor(() => {
      expect(result.current.status).toBe('idle');
      expect(result.current.message).toBeNull();
    });
  });
});
