import { NextResponse } from 'next/server';

export function requireAdmin(request: Request): NextResponse | null {
  const role = request.headers.get('x-mixology-role');

  if (role !== 'admin') {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  return null;
}
