import type { ProviderResult } from '../backend/types';
import { getAuthToken } from '../firebase/firebaseAuthProvider';

/**
 * Fetch wrapper that injects the Firebase ID token as a Bearer header.
 * Uses relative paths so it works in the browser without a base URL.
 */
export async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(path, { ...options, headers });
}

/**
 * Fetch JSON from an API route with auth. Throws on non-2xx responses.
 */
export async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchWithAuth(path, options);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/**
 * Fetch from an API route and map the response to a ProviderResult<T>.
 * Used by adminApi to preserve its existing return type contract.
 */
export async function fetchProviderResult<T>(
  path: string,
  options: RequestInit = {},
): Promise<ProviderResult<T>> {
  try {
    const res = await fetchWithAuth(path, options);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: 'Request failed' }));
      return { success: false, error: body.message ?? 'Request failed' };
    }

    if (res.status === 204) {
      return { success: true };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
