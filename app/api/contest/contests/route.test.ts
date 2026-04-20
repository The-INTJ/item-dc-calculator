import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const loadProviderMock = vi.fn();
const requireAdminMock = vi.fn();

vi.mock('@/contest/lib/backend/serverProvider', () => ({
  loadProvider: () => loadProviderMock(),
}));

vi.mock('../_lib/requireAdmin', () => ({
  requireAdmin: (request: Request) => requireAdminMock(request),
}));

describe('/api/contest/contests route', () => {
  beforeEach(() => {
    loadProviderMock.mockReset();
    requireAdminMock.mockReset();
  });

  it('returns the contest list and current contest for GET', async () => {
    loadProviderMock.mockResolvedValue({
      contests: {
        list: vi.fn().mockResolvedValue({
          success: true,
          data: [{ id: 'contest-1', name: 'Bracket Bash' }],
        }),
        getDefault: vi.fn().mockResolvedValue({
          success: true,
          data: { id: 'contest-1', name: 'Bracket Bash' },
        }),
      },
    });

    const response = await GET(new Request('http://localhost/api/contest/contests'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      contests: [{ id: 'contest-1', name: 'Bracket Bash' }],
      currentContest: { id: 'contest-1', name: 'Bracket Bash' },
    });
  });

  it('enforces admin access for POST', async () => {
    requireAdminMock.mockResolvedValue(Response.json({ message: 'Admin access required' }, { status: 403 }));

    const response = await POST(
      new Request('http://localhost/api/contest/contests', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bracket Bash' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    expect(response.status).toBe(403);
  });

  it('creates a contest through the provider on POST', async () => {
    requireAdminMock.mockResolvedValue(null);
    const created = {
      id: 'contest-1',
      name: 'Bracket Bash',
      slug: 'bracket-bash',
    };
    const create = vi.fn().mockResolvedValue({ success: true, data: created });
    loadProviderMock.mockResolvedValue({
      contests: { create },
    });

    const requestBody = { name: 'Bracket Bash', slug: 'bracket-bash' };
    const response = await POST(
      new Request('http://localhost/api/contest/contests', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    expect(create).toHaveBeenCalledWith(requestBody);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(created);
  });

  it('rejects a contest POST with an invalid body', async () => {
    requireAdminMock.mockResolvedValue(null);
    loadProviderMock.mockResolvedValue({ contests: { create: vi.fn() } });

    const response = await POST(
      new Request('http://localhost/api/contest/contests', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bracket Bash' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Invalid request body');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('slug')]),
    );
  });
});
