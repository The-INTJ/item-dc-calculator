import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';
import { requireAdmin } from '../../_lib/requireAdmin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  /*
const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
*/
  const { id } = await params;
  const provider = await getBackendProvider();

  // Try to find by ID first, then by slug
  const contestsResult = await provider.contests.list();
  if (!contestsResult.success || !contestsResult.data) {
    return NextResponse.json({ message: 'Failed to fetch contests' }, { status: 500 });
  }

  const contest = contestsResult.data.find((c) => c.id === id || c.slug === id);
  if (!contest) {
    return NextResponse.json({ message: 'Contest not found' }, { status: 404 });
  }

  return NextResponse.json(contest);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  /*
const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
*/
  const { id } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider.contests.update(id, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  /*
const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
*/
  const { id } = await params;
  const provider = await getBackendProvider();

  const result = await provider.contests.delete(id);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
