/**
 * Shared utilities for backend providers.
 */

import type { ProviderResult } from './types';

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function success<T>(data: T): ProviderResult<T> {
  return { success: true, data };
}

export function error<T>(message: string): ProviderResult<T> {
  return { success: false, error: message };
}

export async function withDb<T>(
  adapter: { getDb(): unknown | null },
  operation: () => Promise<T>,
  notInitializedMessage = 'Firebase not initialized'
): Promise<ProviderResult<T>> {
  if (!adapter.getDb()) {
    return error(notInitializedMessage);
  }

  try {
    const result = await operation();
    return success(result);
  } catch (err) {
    return error(String(err));
  }
}
