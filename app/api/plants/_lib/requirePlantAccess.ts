import { NextResponse } from 'next/server';

import { getCurrentUserFromRequest } from '@/contest/lib/server/serverAuth';
import { isPlantTrackerEmailAllowed } from '@/plants/lib/access';

/**
 * Verify Firebase authentication and enforce the plant tracker's email allowlist.
 * The Admin-backed plant store bypasses Firestore rules, so every route must call
 * this guard before reading or mutating data.
 */
export async function requirePlantAccess(request: Request): Promise<NextResponse | null> {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { message: 'Sign in to access the plant tracker.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (!isPlantTrackerEmailAllowed(user.email)) {
    return NextResponse.json(
      { message: 'This account does not have access to the plant tracker.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return null;
}
