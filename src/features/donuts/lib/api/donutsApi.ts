/**
 * Client-side access to the donut rotation REST API.
 *
 * The endpoints are open on purpose — the page carries no sign-in — so no auth
 * header is attached. Every call returns a {@link ProviderResult} rather than
 * throwing, and every mutation answers with the whole updated board so the UI
 * never has to patch state by hand.
 */

import type {
  AssignmentPayload,
  CreateOverridePayload,
  UpdatePersonInput,
} from '../schemas';
import type { DonutBoard, IsoDate, ProviderResult } from '../types';

const BASE = '/api/donuts';

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

    return { success: true, data: (await response.json()) as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function write(path: string, method: string, body?: unknown) {
  return request<DonutBoard>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const donutsApi = {
  load(): Promise<ProviderResult<DonutBoard>> {
    return request<DonutBoard>('');
  },

  /** "I cannot do it" — hands the date to whoever has waited longest. */
  decline(date: IsoDate, reason?: string): Promise<ProviderResult<DonutBoard>> {
    const input: AssignmentPayload = { mode: 'decline', date, reason };
    return write('/assignments', 'POST', input);
  },

  /** "I can do it" — hands the date to the person picked from the dropdown. */
  volunteer(date: IsoDate, personId: string): Promise<ProviderResult<DonutBoard>> {
    const input: AssignmentPayload = { mode: 'volunteer', date, personId };
    return write('/assignments', 'POST', input);
  },

  addPerson(name: string, active = true): Promise<ProviderResult<DonutBoard>> {
    return write('/people', 'POST', { name, active });
  },

  updatePerson(
    personId: string,
    changes: UpdatePersonInput,
  ): Promise<ProviderResult<DonutBoard>> {
    return write(`/people/${encodeURIComponent(personId)}`, 'PATCH', changes);
  },

  removePerson(personId: string): Promise<ProviderResult<DonutBoard>> {
    return write(`/people/${encodeURIComponent(personId)}`, 'DELETE');
  },

  setRotation(rotation: (string | null)[]): Promise<ProviderResult<DonutBoard>> {
    return write('/rotation', 'PUT', { rotation });
  },

  addOverride(input: CreateOverridePayload): Promise<ProviderResult<DonutBoard>> {
    return write('/overrides', 'POST', input);
  },

  removeOverride(overrideId: string): Promise<ProviderResult<DonutBoard>> {
    return write(`/overrides/${encodeURIComponent(overrideId)}`, 'DELETE');
  },
};
