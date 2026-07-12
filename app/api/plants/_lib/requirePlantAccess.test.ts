import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requirePlantAccess } from './requirePlantAccess';

const getCurrentUserFromRequestMock = vi.fn();

vi.mock('@/contest/lib/server/serverAuth', () => ({
  getCurrentUserFromRequest: (request: Request) => getCurrentUserFromRequestMock(request),
}));

describe('requirePlantAccess', () => {
  const request = new Request('http://localhost/api/plants');

  beforeEach(() => {
    getCurrentUserFromRequestMock.mockReset();
  });

  it('returns 401 when Firebase authentication is missing', async () => {
    getCurrentUserFromRequestMock.mockResolvedValue(null);

    const response = await requirePlantAccess(request);

    expect(response?.status).toBe(401);
  });

  it('returns 403 for an authenticated email outside the allowlist', async () => {
    getCurrentUserFromRequestMock.mockResolvedValue({
      uid: 'other-user',
      email: 'someone@example.com',
    });

    const response = await requirePlantAccess(request);

    expect(response?.status).toBe(403);
  });

  it('allows an approved Firebase identity', async () => {
    getCurrentUserFromRequestMock.mockResolvedValue({
      uid: 'approved-user',
      email: 'drewwithredhair@gmail.com',
    });

    await expect(requirePlantAccess(request)).resolves.toBeNull();
  });
});
