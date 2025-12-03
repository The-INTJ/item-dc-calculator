import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/src/mixology/backend';

interface RouteParams {
  params: Promise<{ id: string; drinkId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: contestId, drinkId } = await params;
  const provider = await getBackendProvider();

  const result = await provider.drinks.getById(contestId, drinkId);
  if (!result.success || !result.data) {
    return NextResponse.json({ message: result.error ?? 'Drink not found' }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: contestId, drinkId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider.drinks.update(contestId, drinkId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: contestId, drinkId } = await params;
  const provider = await getBackendProvider();

  const result = await provider.drinks.delete(contestId, drinkId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
