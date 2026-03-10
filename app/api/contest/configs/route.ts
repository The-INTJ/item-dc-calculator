import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';
import { requireAdmin } from '../_lib/requireAdmin';

export async function GET() {
  const provider = await getBackendProvider();

  const result = await provider.configs.list();
  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const provider = await getBackendProvider();

  try {
    const body = await request.json();
    const result = await provider.configs.create(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

