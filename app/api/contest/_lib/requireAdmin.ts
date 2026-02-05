import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/contest/lib/api/serverAuth';

function allowLegacyAdminHeader(request: Request): boolean {
  const role = request.headers.get('x-contest-role');
  const allowLegacy =
    process.env.CONTEST_ALLOW_ADMIN_HEADER === 'true' || process.env.NODE_ENV !== 'production';

  if (!allowLegacy || role !== 'admin') {
    return false;
  }

  console.warn('[Auth] Using legacy admin header authentication.');
  return true;
}

export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const user = await getCurrentUserFromRequest(request);

  if (user?.role === 'admin') {
    return null;
  }

  if (allowLegacyAdminHeader(request)) {
    return null;
  }

  return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
}
