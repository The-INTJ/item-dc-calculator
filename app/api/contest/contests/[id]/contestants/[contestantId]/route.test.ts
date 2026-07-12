import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from './route';

const getContestByParamMock = vi.fn();
const requireAdminMock = vi.fn();

vi.mock('@/contest/lib/backend/serverProvider', () => ({
  getContestByParam: (contestId: string) => getContestByParamMock(contestId),
}));

vi.mock('../../../../_lib/requireAdmin', () => ({
  requireAdmin: (request: Request) => requireAdminMock(request),
}));

function makeRequest(): Request {
  return new Request('http://localhost/api/contest/contests/contest-1/contestants/c-1', {
    method: 'DELETE',
  });
}

const routeParams = { params: Promise.resolve({ id: 'contest-1', contestantId: 'c-1' }) };

describe('/api/contest/contests/[id]/contestants/[contestantId] DELETE', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue(null);
  });

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockResolvedValue(
      Response.json({ message: 'Admin access required' }, { status: 403 }),
    );
    const response = await DELETE(makeRequest(), routeParams);
    expect(response.status).toBe(403);
  });

  it('removes the contestant via the cascade and returns 204', async () => {
    const removeCascade = vi.fn().mockResolvedValue({ success: true });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: { id: 'contest-1', contestants: [{ id: 'c-1', displayName: 'A' }], voters: [] },
      provider: { contestants: { removeCascade } },
    });

    const response = await DELETE(makeRequest(), routeParams);
    expect(response.status).toBe(204);
    expect(removeCascade).toHaveBeenCalledWith('contest-1', 'c-1');
  });

  it('returns 404 when the cascade reports an unknown contestant', async () => {
    const removeCascade = vi.fn().mockResolvedValue({
      success: false,
      error: 'Contestant not found',
    });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: { id: 'contest-1', contestants: [], voters: [] },
      provider: { contestants: { removeCascade } },
    });

    const response = await DELETE(makeRequest(), routeParams);
    expect(response.status).toBe(404);
  });
});
