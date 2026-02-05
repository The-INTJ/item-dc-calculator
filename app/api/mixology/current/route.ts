import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';

export async function GET() {
  const provider = await getBackendProvider();
  const result = await provider.contests.getDefault();

  if (!result.success) {
    return NextResponse.json({ message: result.error ?? 'Failed to load contest' }, { status: 500 });
  }

  return NextResponse.json({ currentContest: result.data ?? null });
}
