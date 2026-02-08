import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';

interface RouteParams {
  params: Promise<{ configId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { configId } = await params;
  const provider = await getBackendProvider();

  const result = await provider.configs.getById(configId);
  if (!result.success || !result.data) {
    return NextResponse.json({ message: result.error ?? 'Config not found' }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { configId } = await params;
  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider.configs.update(configId, body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { configId } = await params;
  const provider = await getBackendProvider();

  const result = await provider.configs.delete(configId);
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
