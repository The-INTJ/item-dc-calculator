import { NextResponse } from 'next/server';
import type { ZodType, z } from 'zod';
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

/**
 * Validates a request body against a zod schema. On success returns the parsed
 * data; on failure returns a 400 response with field-level error details so
 * callers get actionable messages instead of a generic "invalid body".
 */
export async function parseBody<S extends ZodType>(request: Request, schema: S): Promise<
  | { ok: true; data: z.infer<S> }
  | { ok: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError('Invalid JSON in request body', 400) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    });
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'Invalid request body', errors: issues },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: result.data };
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
