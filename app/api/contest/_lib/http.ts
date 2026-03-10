import { NextResponse } from 'next/server';
import type { ProviderResult } from '@/contest/lib/backend/types';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readJsonBody<T>(request: Request) {
  try {
    return { ok: true as const, data: (await request.json()) as T };
  } catch {
    return { ok: false as const, response: jsonError('Invalid request body', 400) };
  }
}

export function fromProviderResult<T>(
  result: ProviderResult<T>,
  options: {
    failureStatus?: number;
    successStatus?: number;
    notFoundMessage?: string;
  } = {},
) {
  const { failureStatus = 400, successStatus = 200, notFoundMessage } = options;

  if (!result.success) {
    return jsonError(result.error ?? notFoundMessage ?? 'Request failed', failureStatus);
  }

  if (result.data === undefined && successStatus === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return jsonSuccess(result.data ?? null, successStatus);
}
