import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const getContestByParamMock = vi.fn();
const requireAuthMock = vi.fn();

vi.mock('@/contest/lib/backend/serverProvider', () => ({
  getContestByParam: (contestId: string) => getContestByParamMock(contestId),
}));

vi.mock('../../../_lib/requireAuth', () => ({
  requireAuth: (request: Request) => requireAuthMock(request),
}));

const authedUser = {
  uid: 'user-1',
  displayName: 'Test User',
  role: 'voter' as const,
};

describe('/api/contest/contests/[id]/scores route', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
    requireAuthMock.mockReset();
  });

  it('filters scores by entry and user for GET', async () => {
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: { id: 'contest-1' },
      provider: {
        scores: {
          listByEntry: vi.fn().mockResolvedValue({
            success: true,
            data: [
              { id: 'score-1', userId: 'user-1' },
              { id: 'score-2', userId: 'user-2' },
            ],
          }),
        },
      },
    });

    const response = await GET(
      new Request('http://localhost/api/contest/contests/contest-1/scores?entryId=entry-1&userId=user-2'),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      scores: [{ id: 'score-2', userId: 'user-2' }],
    });
  });

  it('rejects POST requests when the caller is not authenticated', async () => {
    requireAuthMock.mockResolvedValue({
      user: null,
      response: Response.json({ message: 'Authentication required' }, { status: 401 }),
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({ entryId: 'entry-1' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(401);
  });

  it('rejects POST requests without a matchupId', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: { id: 'contest-1', contestants: [], voters: [] },
      provider: {},
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({ entryId: 'entry-1' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Invalid request body');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('matchupId')]),
    );
  });

  it('rejects POST when the matchup is not in the shake phase', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        contestants: [{ id: 'c-1', displayName: 'A' }],
        voters: [],
      },
      provider: {
        matchups: {
          getById: vi.fn().mockResolvedValue({
            success: true,
            data: {
              id: 'matchup-1',
              phase: 'set',
              entries: [
                { id: 'entry-1', contestantId: 'c-1', matchupId: 'matchup-1', name: 'A' },
                { id: 'entry-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'B' },
              ],
            },
          }),
        },
        scores: { submit: vi.fn() },
        voters: { create: vi.fn() },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({
          entryId: 'entry-1',
          matchupId: 'matchup-1',
          categoryId: 'taste',
          value: 8,
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.message).toMatch(/not open for scoring/i);
    expect(body.code).toBe('MATCHUP_CLOSED');
  });

  it('rejects out-of-range breakdowns against the contest config', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    const submitScore = vi.fn();
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        config: {
          topic: 'Mixology',
          attributes: [{ id: 'taste', label: 'Taste', min: 1, max: 10 }],
        },
        contestants: [{ id: 'c-1', displayName: 'A' }],
        voters: [{ id: 'user-1' }],
      },
      provider: {
        matchups: {
          getById: vi.fn().mockResolvedValue({
            success: true,
            data: {
              id: 'matchup-1',
              phase: 'shake',
              entries: [
                { id: 'entry-1', contestantId: 'c-1', matchupId: 'matchup-1', name: 'A' },
                { id: 'entry-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'B' },
              ],
            },
          }),
        },
        scores: {
          submit: submitScore,
          getById: vi.fn().mockResolvedValue({ success: true, data: null }),
        },
        voters: { create: vi.fn() },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({
          entryId: 'entry-1',
          matchupId: 'matchup-1',
          breakdown: { taste: 11 },
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('SCORE_INVALID');
    expect(body.message).toMatch(/taste: must be between 1 and 10/);
    expect(submitScore).not.toHaveBeenCalled();
  });

  it('merges a partial update onto the existing vote before validating', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    const submitScore = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'score-1', entryId: 'entry-1', userId: 'user-1' },
    });
    const getById = vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'user-1_matchup-1_entry-1',
        entryId: 'entry-1',
        userId: 'user-1',
        matchupId: 'matchup-1',
        breakdown: { taste: 8, aroma: 6 },
      },
    });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        config: {
          topic: 'Mixology',
          attributes: [
            { id: 'taste', label: 'Taste', min: 1, max: 10 },
            { id: 'aroma', label: 'Aroma', min: 0, max: 10 },
          ],
        },
        contestants: [{ id: 'c-1', displayName: 'A' }],
        voters: [{ id: 'user-1' }],
      },
      provider: {
        matchups: {
          getById: vi.fn().mockResolvedValue({
            success: true,
            data: {
              id: 'matchup-1',
              phase: 'shake',
              entries: [
                { id: 'entry-1', contestantId: 'c-1', matchupId: 'matchup-1', name: 'A' },
                { id: 'entry-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'B' },
              ],
            },
          }),
        },
        scores: { submit: submitScore, getById },
        voters: { create: vi.fn() },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({
          entryId: 'entry-1',
          matchupId: 'matchup-1',
          categoryId: 'aroma',
          value: 9,
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(200);
    expect(getById).toHaveBeenCalledWith('contest-1', 'user-1_matchup-1_entry-1');
    expect(submitScore).toHaveBeenCalledWith(
      'contest-1',
      expect.objectContaining({ breakdown: { taste: 8, aroma: 9 } }),
    );
  });

  it('rejects POST when the entry is not part of the matchup', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        contestants: [{ id: 'c-1', displayName: 'A' }],
        voters: [],
      },
      provider: {
        matchups: {
          getById: vi.fn().mockResolvedValue({
            success: true,
            data: {
              id: 'matchup-1',
              phase: 'shake',
              entries: [
                { id: 'entry-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'B' },
                { id: 'entry-3', contestantId: 'c-3', matchupId: 'matchup-1', name: 'C' },
              ],
            },
          }),
        },
        scores: { submit: vi.fn() },
        voters: { create: vi.fn() },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({
          entryId: 'entry-1',
          matchupId: 'matchup-1',
          breakdown: { taste: 8 },
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/not part of this matchup/i);
  });

  it('submits scores using the uid from the verified token and auto-registers new voters', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    const createVoter = vi.fn().mockResolvedValue({ success: true, data: null });
    const submitScore = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'score-1', entryId: 'entry-1', userId: 'user-1' },
    });
    const getMatchup = vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'matchup-1',
        phase: 'shake',
        entries: [
          { id: 'entry-1', contestantId: 'c-1', matchupId: 'matchup-1', name: 'A' },
          { id: 'entry-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'B' },
        ],
      },
    });

    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        contestants: [{ id: 'c-1', displayName: 'A' }],
        voters: [],
      },
      provider: {
        matchups: { getById: getMatchup },
        voters: { create: createVoter },
        scores: { submit: submitScore },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({
          entryId: 'entry-1',
          matchupId: 'matchup-1',
          categoryId: 'taste',
          value: 8,
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(getMatchup).toHaveBeenCalledWith('contest-1', 'matchup-1');
    expect(createVoter).toHaveBeenCalledWith('contest-1', {
      id: 'user-1',
      displayName: 'Test User',
      role: 'voter',
    });
    expect(submitScore).toHaveBeenCalledWith('contest-1', {
      entryId: 'entry-1',
      userId: 'user-1',
      matchupId: 'matchup-1',
      breakdown: { taste: 8 },
    });
    expect(response.status).toBe(200);
  });

  it('ignores any userId in the body and uses the token uid', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    const submitScore = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'score-1', entryId: 'entry-1', userId: 'user-1' },
    });

    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        entries: [{ id: 'entry-1' }],
        voters: [{ id: 'user-1' }],
      },
      provider: {
        matchups: {
          getById: vi.fn().mockResolvedValue({
            success: true,
            data: {
              id: 'matchup-1',
              phase: 'shake',
              entries: [
                { id: 'entry-1', contestantId: 'c-1', matchupId: 'matchup-1', name: 'A' },
                { id: 'entry-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'B' },
              ],
            },
          }),
        },
        scores: { submit: submitScore },
        voters: { create: vi.fn() },
      },
    });

    await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({
          entryId: 'entry-1',
          matchupId: 'matchup-1',
          userId: 'someone-else',
          breakdown: { taste: 9 },
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(submitScore).toHaveBeenCalledWith(
      'contest-1',
      expect.objectContaining({ userId: 'user-1' }),
    );
  });
});
