/**
 * Session-cookie sync helpers.
 *
 * The `__session` cookie is produced by `POST /api/contest/auth/session`
 * (takes an ID token, returns `Set-Cookie`). The client calls these helpers:
 *   - on login / sign-up (explicitly, or implicitly via onIdTokenChanged)
 *   - on hourly Firebase ID token refresh (via onIdTokenChanged)
 *   - on logout (DELETE)
 *
 * Failures are logged but non-fatal: the client-side auth state still works
 * for API calls (which use Bearer tokens); only server-rendered navigation
 * needs the cookie.
 */

import { fetchWithAuth } from '../../lib/api/fetchWithAuth';

const SESSION_ENDPOINT = '/api/contest/auth/session';

export async function syncSessionCookie(idToken: string): Promise<void> {
  try {
    const res = await fetch(SESSION_ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      console.warn('[sessionSync] Failed to create session cookie:', res.status);
    }
  } catch (error) {
    console.warn('[sessionSync] Error creating session cookie:', error);
  }
}

export async function clearSessionCookie(): Promise<void> {
  try {
    // Use fetchWithAuth so the Bearer token is attached — DELETE requires
    // auth so a stranger can't clear someone else's cookie.
    await fetchWithAuth(SESSION_ENDPOINT, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch (error) {
    console.warn('[sessionSync] Error clearing session cookie:', error);
  }
}
