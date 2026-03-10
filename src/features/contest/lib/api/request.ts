import type { ProviderResult } from '../backend/types';
import { getAuthToken } from '../firebase/firebaseAuthProvider';

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const maybePayload = payload as { error?: string; message?: string };
  return maybePayload.message ?? maybePayload.error ?? fallback;
}

async function buildHeaders(headers?: HeadersInit, hasJsonBody = false): Promise<Headers> {
  const resolvedHeaders = new Headers(headers);

  if (hasJsonBody && !resolvedHeaders.has('Content-Type')) {
    resolvedHeaders.set('Content-Type', 'application/json');
  }

  const token = await getAuthToken();
  if (token && !resolvedHeaders.has('Authorization')) {
    resolvedHeaders.set('Authorization', `Bearer ${token}`);
  }

  return resolvedHeaders;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const isJsonBody = Boolean(options.body) && !(options.body instanceof FormData);
  const headers = await buildHeaders(options.headers, isJsonBody);
  const body = isJsonBody
    ? JSON.stringify(options.body)
    : (options.body as BodyInit | undefined);
  const response = await fetch(path, {
    ...options,
    headers,
    body,
    credentials: 'same-origin',
  });
  const payload = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.statusText || 'Request failed'));
  }

  return payload as T;
}

export async function apiRequestResult<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ProviderResult<T>> {
  try {
    const data = await apiRequest<T>(path, options);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
