/**
 * Backend provider singleton and context.
 *
 * This module provides a singleton instance of the backend provider
 * and a React context for accessing it throughout the application.
 *
 * NOTE: API routes run server-side where Firebase client SDK doesn't work.
 * For now, API routes use in-memory provider. Client-side auth uses Firebase.
 *
 * Future options:
 * 1. Use Firebase Admin SDK for server-side operations
 * 2. Move all data operations to client-side with Firebase client SDK
 * 3. Use Vercel Edge Functions with Firebase REST API
 */

import { createInMemoryProvider } from './inMemoryProvider';
import type { ContestBackendProvider } from './types';

// Export types for external use
export type {
  ContestBackendProvider,
  ProviderResult,
  ContestsProvider,
  EntriesProvider,
  JudgesProvider,
  ScoresProvider,
} from './types';

export type { Contest, Entry, Judge, ScoreEntry, ScoreBreakdown } from './types';

// Legacy exports for gradual migration
export type {
  ContestBackendProvider as MixologyBackendProvider,
  EntriesProvider as DrinksProvider,
  Entry as Drink,
} from './types';

/**
 * Currently configured backend provider.
 *
 * Server-side (API routes): Uses in-memory provider
 * Client-side (React): Auth uses Firebase, data via API routes
 */
let _provider: ContestBackendProvider | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Gets the singleton backend provider instance.
 * Automatically initializes on first call.
 */
export async function getBackendProvider(): Promise<ContestBackendProvider> {
  if (!_provider) {
    // Using in-memory provider for API routes (server-side)
    // Client-side auth uses Firebase directly via AuthContext
    _provider = createInMemoryProvider();
  }

  if (!_initPromise) {
    _initPromise = _provider.initialize().then((result) => {
      if (!result.success) {
        console.error('Failed to initialize backend provider:', result.error);
        throw new Error(result.error);
      }
    });
  }

  await _initPromise;
  return _provider;
}

/**
 * Gets the provider synchronously (only use after initialization)
 */
export function getBackendProviderSync(): ContestBackendProvider {
  if (!_provider) {
    throw new Error('Backend provider not initialized. Call getBackendProvider() first.');
  }
  return _provider;
}

/**
 * Reset the provider (useful for testing)
 */
export async function resetBackendProvider(): Promise<void> {
  if (_provider) {
    await _provider.dispose();
  }
  _provider = null;
  _initPromise = null;
}
