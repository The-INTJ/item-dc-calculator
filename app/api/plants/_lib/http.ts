import { NextResponse } from 'next/server';
import type { ZodType, z } from 'zod';

import type { ProviderResult } from '@/plants/lib/types';

/** Plant data is always live — never let a browser or proxy cache a response. */
const NO_STORE: Record<string, string> = { 'Cache-Control': 'no-store' };

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ message }, { status, headers: NO_STORE });
}

export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

/**
 * Validate a request body against a zod schema, returning either the parsed
 * data or a 400 response with field-level error details.
 */
export async function parseBody<S extends ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError('Invalid JSON in request body', 400) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    });
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'Invalid request body', errors },
        { status: 400, headers: NO_STORE },
      ),
    };
  }

  return { ok: true, data: result.data };
}

/**
 * Map a store {@link ProviderResult} to an HTTP response. Errors mentioning
 * "not found" are promoted to 404; everything else uses `failureStatus`.
 */
export function fromResult<T>(
  result: ProviderResult<T>,
  options: { failureStatus?: number; successStatus?: number } = {},
): NextResponse {
  const { failureStatus = 500, successStatus = 200 } = options;

  if (!result.success) {
    const notFound = /not found/i.test(result.error ?? '');
    return jsonError(result.error ?? 'Request failed', notFound ? 404 : failureStatus);
  }

  if (result.data === undefined && successStatus === 204) {
    return new NextResponse(null, { status: 204, headers: NO_STORE });
  }

  return jsonSuccess(result.data ?? null, successStatus);
}
