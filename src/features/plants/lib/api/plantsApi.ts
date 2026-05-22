/**
 * Client-side access to the plant tracker REST API. The endpoints are open and
 * non-cached, so this is a thin `fetch` wrapper that always returns a
 * {@link ProviderResult} rather than throwing.
 */

import type { Plant, PlantEventType, ProviderResult } from '../types';

const BASE = '/api/plants';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ProviderResult<T>> {
  try {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${BASE}${path}`, {
      cache: 'no-store',
      ...options,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Request failed' }));
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Request failed (${response.status})`;
      return { success: false, error: message };
    }

    if (response.status === 204) {
      return { success: true };
    }

    return { success: true, data: (await response.json()) as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const plantsApi = {
  async list(): Promise<ProviderResult<Plant[]>> {
    const result = await request<{ plants: Plant[] }>('');
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data?.plants ?? [] };
  },

  create(name: string): Promise<ProviderResult<Plant>> {
    return request<Plant>('', { method: 'POST', body: JSON.stringify({ name }) });
  },

  rename(id: string, name: string): Promise<ProviderResult<Plant>> {
    return request<Plant>(`/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  remove(id: string): Promise<ProviderResult<void>> {
    return request<void>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  addEvent(id: string, type: PlantEventType): Promise<ProviderResult<Plant>> {
    return request<Plant>(`/${encodeURIComponent(id)}/events`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  deleteEvent(id: string, eventId: string): Promise<ProviderResult<Plant>> {
    return request<Plant>(
      `/${encodeURIComponent(id)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
    );
  },
};
