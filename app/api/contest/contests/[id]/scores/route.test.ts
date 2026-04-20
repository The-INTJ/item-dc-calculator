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
      contest: { id: 'contest-1', entries: [], voters: [] },
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
        entries: [{ id: 'entry-1' }],
        voters: [],
      },
      provider: {
        matchups: {
          getById: vi.fn().mockResolvedValue({
            success: true,
            data: {
              id: 'matchup-1',
              phase: 'set',
              entryIds: ['entry-1', 'entry-2'],
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

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/not open for scoring/i);
  });

  it('rejects POST when the entry is not part of the matchup', async () => {
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        entries: [{ id: 'entry-1' }],
        voters: [],
      },
      provider: {
        matchups: {
          getById: vi.fn().mockResolvedValue({
            success: true,
            data: {
              id: 'matchup-1',
              phase: 'shake',
              entryIds: ['entry-2', 'entry-3'],
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
        entryIds: ['entry-1', 'entry-2'],
      },
    });

    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        entries: [{ id: 'entry-1' }],
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
              entryIds: ['entry-1', 'entry-2'],
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
