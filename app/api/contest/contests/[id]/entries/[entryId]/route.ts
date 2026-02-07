import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';
import { requireAdmin } from '../../../../_lib/requireAdmin';

interface RouteParams {
  params: Promise<{ id: string; entryId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  /*
const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
*/
  const { id: contestId, entryId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.entries?.getById(contestId, entryId);
  if (!result.success || !result.data) {
    return NextResponse.json({ message: result.error ?? 'Entry not found' }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  /*
const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
*/
  const { id: contestId, entryId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider?.entries?.update(contestId, entryId, body);

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
  const { id: contestId, entryId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.entries?.delete(contestId, entryId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
