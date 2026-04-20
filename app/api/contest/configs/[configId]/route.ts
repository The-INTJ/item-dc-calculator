import { NextResponse } from 'next/server';
import { fromProviderResult, jsonError, jsonSuccess, parseBody } from '../../_lib/http';
import { loadProvider } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../../_lib/requireAdmin';
import { UpdateContestConfigBodySchema } from '@/contest/lib/schemas';

interface RouteParams {
  params: Promise<{ configId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { configId } = await params;
  const provider = await loadProvider();

  const result = await provider.configs.getById(configId);
  if (!result.success || !result.data) {
    return jsonError(result.error ?? 'Config not found', 404);
  }

  return jsonSuccess(result.data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { configId } = await params;
  const provider = await loadProvider();

  const body = await parseBody(request, UpdateContestConfigBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const result = await provider.configs.update(configId, body.data);

  return fromProviderResult(result, { failureStatus: 404 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { configId } = await params;
  const provider = await loadProvider();

  const result = await provider.configs.delete(configId);
  if (!result.success) {
    return jsonError(result.error ?? 'Config not found', 404);
  }

  return new NextResponse(null, { status: 204 });
}
