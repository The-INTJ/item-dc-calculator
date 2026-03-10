import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const getContestByParamMock = vi.fn();

vi.mock('../../../_lib/provider', () => ({
  getContestByParam: (contestId: string) => getContestByParamMock(contestId),
}));

describe('/api/contest/contests/[id]/scores route', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
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

  it('rejects POST requests without entryId and userId', async () => {
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: { id: 'contest-1', entries: [], voters: [] },
      provider: {},
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'entryId and userId are required.',
    });
  });

  it('submits scores and auto-registers new voters on POST', async () => {
    const createVoter = vi.fn().mockResolvedValue({ success: true, data: null });
    const submitScore = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'score-1', entryId: 'entry-1', userId: 'user-1' },
    });

    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: {
        id: 'contest-1',
        entries: [{ id: 'entry-1', round: 'round-1' }],
        voters: [],
      },
      provider: {
        voters: { create: createVoter },
        scores: { submit: submitScore },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/scores', {
        method: 'POST',
        body: JSON.stringify({
          entryId: 'entry-1',
          userId: 'user-1',
          categoryId: 'taste',
          value: 8,
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(createVoter).toHaveBeenCalledWith('contest-1', {
      id: 'user-1',
      displayName: 'Guest',
      role: 'voter',
    });
    expect(submitScore).toHaveBeenCalledWith('contest-1', {
      entryId: 'entry-1',
      userId: 'user-1',
      round: 'round-1',
      breakdown: { taste: 8 },
    });
    expect(response.status).toBe(200);
  });
});
