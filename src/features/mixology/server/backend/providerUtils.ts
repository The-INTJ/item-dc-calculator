/**
 * Shared utilities for backend providers.
 *
 * These helpers are used by both Firebase and in-memory providers
 * to ensure consistent result wrapping and ID generation.
 */

import type { ProviderResult } from './types';

/**
 * Generates a unique ID with a given prefix.
 * Format: `{prefix}-{timestamp}-{random}`
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Wraps data in a successful ProviderResult.
 */
export function success<T>(data: T): ProviderResult<T> {
  return { success: true, data };
}

/**
 * Wraps an error message in a failed ProviderResult.
 */
export function error<T>(message: string): ProviderResult<T> {
  return { success: false, error: message };
}

/**
 * Interface for objects that can check database initialization.
 */
export interface DbCheckable {
  getDb(): unknown | null;
}

/**
 * Wraps an async operation with database initialization check and error handling.
 *
 * This reduces boilerplate in providers by handling:
 * - Database null check (returns error if not initialized)
 * - Try/catch wrapping (returns error on exception)
 * - Success wrapping (returns success with result)
 *
 * @param adapter - Object with getDb() method to check initialization
 * @param operation - Async operation to execute
 * @param notInitializedMessage - Error message when db is null (default: 'Firebase not initialized')
 */
export async function withDb<T>(
  adapter: DbCheckable,
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
