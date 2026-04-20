import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest, type ServerUser } from '@/contest/lib/server/serverAuth';

type AuthSuccess = { user: ServerUser; response: null };
type AuthFailure = { user: null; response: NextResponse };

/**
 * Auth guard that verifies the caller is authenticated.
 * Returns the authenticated user's identity (including uid from the verified token)
 * or a 401 response if not authenticated.
 */
export async function requireAuth(request: Request): Promise<AuthSuccess | AuthFailure> {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ message: 'Authentication required' }, { status: 401 }),
    };
  }

  return { user, response: null };
}
