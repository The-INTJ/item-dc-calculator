/**
 * Session cookie bridge.
 *
 * Server components (e.g. `/admin`) authenticate via the `__session` cookie
 * read in `getCurrentUser()` (see src/features/contest/lib/server/serverAuth.ts).
 * This route is the producer side:
 *
 *   POST   — exchange a Firebase ID token for a long-lived session cookie.
 *            Called by the client on login and on ID token refresh.
 *   DELETE — clear the cookie on logout.
 *
 * API routes continue to use short-lived ID tokens via the `Authorization`
 * header; the session cookie is specifically for same-origin navigation to
 * server-rendered pages.
 */

import { NextResponse } from 'next/server';
import { jsonError, parseBody } from '../../_lib/http';
import { requireAuth } from '../../_lib/requireAuth';
import { getFirebaseAdminAuth } from '@/contest/lib/firebase/admin';
import { CreateSessionBodySchema } from '@/contest/lib/schemas';

const SESSION_COOKIE_NAME = '__session';

// Firebase allows up to 14 days; 7 keeps a reasonable balance between UX and
// staleness for custom-claim changes (role promotions/demotions).
const SESSION_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

function buildCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export async function POST(request: Request) {
  const body = await parseBody(request, CreateSessionBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return jsonError('Firebase Admin SDK is not configured', 500);
  }

  try {
    // Verify the ID token first so we reject forged/expired tokens before
    // issuing a session cookie. `createSessionCookie` alone would reject
    // invalid tokens, but verifying explicitly gives us a cleaner error.
    await adminAuth.verifyIdToken(body.data.idToken, true);

    const sessionCookie = await adminAuth.createSessionCookie(body.data.idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionCookie,
      buildCookieOptions(SESSION_EXPIRES_IN_MS / 1000),
    );
    return response;
  } catch (error) {
    console.error('[auth/session] Failed to create session cookie:', error);
    return jsonError('Failed to create session', 401);
  }
}

export async function DELETE(request: Request) {
  // Require auth so a stranger can't clear someone else's cookie via CSRF.
  // Uses Bearer token (or existing session cookie) — both are handled by
  // getCurrentUserFromRequest under the hood.
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const response = NextResponse.json({ success: true });
  // Overwrite with an empty value and maxAge=0 so browsers drop the cookie.
  response.cookies.set(SESSION_COOKIE_NAME, '', buildCookieOptions(0));
  return response;
}
