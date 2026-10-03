import { NextResponse } from 'next/server';

import { jsonSuccess } from '@/app/api/contest/_lib/http';
import { isTracerError, TRACER_ERROR_STATUS, type TracerError } from '@/features/tracer/lib/errors';

/** `{ message, code, reason? }` with the status from the single code table. */
export function tracerErrorResponse(error: TracerError): NextResponse {
  return NextResponse.json(
    { message: error.message, code: error.code, ...(error.reason ? { reason: error.reason } : {}) },
    { status: TRACER_ERROR_STATUS[error.code] },
  );
}

/**
 * Run a service call and turn its outcome into a response. Typed Tracer
 * errors map to their status; anything unexpected is logged and becomes 500.
 */
export async function respond<T>(work: () => Promise<T>, successStatus = 200): Promise<NextResponse> {
  try {
    return jsonSuccess(await work(), successStatus);
  } catch (error) {
    if (isTracerError(error)) return tracerErrorResponse(error);
    console.error('[tracer] Unexpected error:', error);
    return NextResponse.json({ message: 'Something went wrong.', code: 'INTERNAL' }, { status: 500 });
  }
}
