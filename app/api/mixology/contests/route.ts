import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/mixology/server/backend';
import { requireAdmin } from '../_lib/requireAdmin';

export async function GET(request: Request) {
  const adminError = requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const provider = await getBackendProvider();
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (slug) {
    const result = await provider.contests.getBySlug(slug);
    if (!result.success || !result.data) {
      return NextResponse.json({ message: result.error ?? 'Contest not found' }, { status: 404 });
    }
    return NextResponse.json(result.data);
  }

  const [contestsResult, defaultResult] = await Promise.all([
    provider.contests.list(),
    provider.contests.getDefault(),
  ]);

  return NextResponse.json({
    contests: contestsResult.data ?? [],
    currentContest: defaultResult.data ?? null,
  });
}

export async function POST(request: Request) {
  const adminError = requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider.contests.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
