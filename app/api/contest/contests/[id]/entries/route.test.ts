import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const getContestByParamMock = vi.fn();
const requireAdminMock = vi.fn();

vi.mock('../../../_lib/provider', () => ({
  getContestByParam: (contestId: string) => getContestByParamMock(contestId),
}));

vi.mock('../../../_lib/requireAdmin', () => ({
  requireAdmin: (request: Request) => requireAdminMock(request),
}));

describe('/api/contest/contests/[id]/entries route', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
    requireAdminMock.mockReset();
  });

  it('returns entries for a resolved contest', async () => {
    getContestByParamMock.mockResolvedValue({
      contest: { id: 'contest-1' },
      error: null,
      provider: {
        entries: {
          listByContest: vi.fn().mockResolvedValue({
            success: true,
            data: [{ id: 'entry-1', name: 'North' }],
          }),
        },
      },
    });

    const response = await GET(new Request('http://localhost/api/contest/contests/contest-1/entries'), {
      params: Promise.resolve({ id: 'contest-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: 'entry-1', name: 'North' }]);
  });

  it('enforces admin access for entry creation', async () => {
    requireAdminMock.mockResolvedValue(Response.json({ message: 'Admin access required' }, { status: 403 }));

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/entries', {
        method: 'POST',
        body: JSON.stringify({ name: 'North' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(response.status).toBe(403);
  });

  it('creates an entry through the provider when authorized', async () => {
    requireAdminMock.mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'entry-1', name: 'North' },
    });
    getContestByParamMock.mockResolvedValue({
      contest: { id: 'contest-1' },
      error: null,
      provider: {
        entries: { create },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/contest/contests/contest-1/entries', {
        method: 'POST',
        body: JSON.stringify({ name: 'North' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'contest-1' }) },
    );

    expect(create).toHaveBeenCalledWith('contest-1', { name: 'North' });
    expect(response.status).toBe(201);
  });
});
