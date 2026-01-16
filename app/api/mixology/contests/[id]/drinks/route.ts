import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/src/mixology/backend';
import { requireAdmin } from '../../../_lib/requireAdmin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const adminError = requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestId } = await params;
  const provider = await getBackendProvider();

  const result = await provider.drinks.listByContest(contestId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: Request, { params }: RouteParams) {
  const adminError = requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider.drinks.create(contestId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
