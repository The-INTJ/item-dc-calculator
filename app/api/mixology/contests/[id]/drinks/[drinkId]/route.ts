import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/mixology/server/backend';
import { requireAdmin } from '../../../../_lib/requireAdmin';

interface RouteParams {
  params: Promise<{ id: string; drinkId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestId, drinkId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.entries?.getById(contestId, drinkId);
  if (!result.success || !result.data) {
    return NextResponse.json({ message: result.error ?? 'Drink not found' }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestId, drinkId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider?.entries?.update(contestId, drinkId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }
  const { id: contestId, drinkId } = await params;
  const provider = await getBackendProvider();

  const result = await provider?.entries?.delete(contestId, drinkId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
