import { NextResponse } from 'next/server';
import { requireAuth } from './requireAuth';

function allowLegacyAdminHeader(request: Request): boolean {
  if (process.env.CONTEST_ALLOW_ADMIN_HEADER !== 'true') {
    return false;
  }

  if (request.headers.get('x-contest-role') !== 'admin') {
    return false;
  }

  console.warn('[Auth] Using legacy admin header authentication.');
  return true;
}

export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const result = await requireAuth(request);

  if (result.user?.role === 'admin') {
    return null;
  }

  if (allowLegacyAdminHeader(request)) {
    return null;
  }

  return result.response ?? NextResponse.json({ message: 'Admin access required' }, { status: 403 });
}
