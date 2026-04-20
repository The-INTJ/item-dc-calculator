import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, POST } from './route';

const createSessionCookieMock = vi.fn();
const verifyIdTokenMock = vi.fn();
const getFirebaseAdminAuthMock = vi.fn();
const requireAuthMock = vi.fn();

vi.mock('@/contest/lib/firebase/admin', () => ({
  getFirebaseAdminAuth: () => getFirebaseAdminAuthMock(),
}));

vi.mock('../../_lib/requireAuth', () => ({
  requireAuth: (request: Request) => requireAuthMock(request),
}));

function buildPostRequest(body: unknown): Request {
  return new Request('http://localhost/api/contest/auth/session', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildDeleteRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/contest/auth/session', {
    method: 'DELETE',
    headers,
  });
}

describe('/api/contest/auth/session route', () => {
  beforeEach(() => {
    createSessionCookieMock.mockReset();
    verifyIdTokenMock.mockReset();
    getFirebaseAdminAuthMock.mockReset();
    requireAuthMock.mockReset();

    getFirebaseAdminAuthMock.mockReturnValue({
      createSessionCookie: createSessionCookieMock,
      verifyIdToken: verifyIdTokenMock,
    });
  });

  describe('POST', () => {
    it('exchanges an ID token for a session cookie', async () => {
      verifyIdTokenMock.mockResolvedValue({ uid: 'user-1' });
      createSessionCookieMock.mockResolvedValue('cookie-value-xyz');

      const response = await POST(buildPostRequest({ idToken: 'valid-id-token' }));

      expect(response.status).toBe(200);
      expect(verifyIdTokenMock).toHaveBeenCalledWith('valid-id-token', true);
      expect(createSessionCookieMock).toHaveBeenCalledWith('valid-id-token', {
        expiresIn: 7 * 24 * 60 * 60 * 1000,
      });

      const setCookie = response.headers.get('set-cookie') ?? '';
      expect(setCookie).toContain('__session=cookie-value-xyz');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('Path=/');
      expect(setCookie.toLowerCase()).toContain('samesite=lax');
      expect(setCookie).toContain(`Max-Age=${7 * 24 * 60 * 60}`);
    });

    it('rejects an empty idToken with 400', async () => {
      const response = await POST(buildPostRequest({ idToken: '' }));
      expect(response.status).toBe(400);
      expect(verifyIdTokenMock).not.toHaveBeenCalled();
      expect(createSessionCookieMock).not.toHaveBeenCalled();
    });

    it('rejects a missing idToken with 400', async () => {
      const response = await POST(buildPostRequest({}));
      expect(response.status).toBe(400);
      expect(createSessionCookieMock).not.toHaveBeenCalled();
    });

    it('rejects invalid JSON with 400', async () => {
      const request = new Request('http://localhost/api/contest/auth/session', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('returns 401 when verifyIdToken rejects', async () => {
      verifyIdTokenMock.mockRejectedValue(new Error('token expired'));

      const response = await POST(buildPostRequest({ idToken: 'expired-token' }));

      expect(response.status).toBe(401);
      expect(createSessionCookieMock).not.toHaveBeenCalled();
    });

    it('returns 500 when the Admin SDK is not configured', async () => {
      getFirebaseAdminAuthMock.mockReturnValue(null);

      const response = await POST(buildPostRequest({ idToken: 'valid-id-token' }));

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE', () => {
    it('returns 401 when the caller is unauthenticated', async () => {
      requireAuthMock.mockResolvedValue({
        user: null,
        response: Response.json({ message: 'Authentication required' }, { status: 401 }),
      });

      const response = await DELETE(buildDeleteRequest());

      expect(response.status).toBe(401);
    });

    it('clears the __session cookie when authenticated', async () => {
      requireAuthMock.mockResolvedValue({
        user: { uid: 'user-1', displayName: 'Jane', role: 'voter' },
        response: null,
      });

      const response = await DELETE(buildDeleteRequest({ authorization: 'Bearer tkn' }));

      expect(response.status).toBe(200);
      const setCookie = response.headers.get('set-cookie') ?? '';
      expect(setCookie).toContain('__session=');
      expect(setCookie).toContain('Max-Age=0');
      expect(setCookie).toContain('HttpOnly');
    });
  });
});
