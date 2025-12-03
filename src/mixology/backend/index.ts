/**
 * Backend provider singleton and context.
 *
 * This module provides a singleton instance of the backend provider
 * and a React context for accessing it throughout the application.
 * To switch backends, simply change the provider creation here.
 */

import { createInMemoryProvider } from './inMemoryProvider';
import type { MixologyBackendProvider } from './types';

// Export types for external use
export type { MixologyBackendProvider, ProviderResult } from './types';
export type {
  Contest,
  Drink,
  Judge,
  ScoreEntry,
  ScoreBreakdown,
  ContestsProvider,
  DrinksProvider,
  JudgesProvider,
  ScoresProvider,
} from './types';

/**
 * Currently configured backend provider.
 *
 * To switch to Firebase or another backend:
 * 1. Implement MixologyBackendProvider for the new backend
 * 2. Import and use it here instead of createInMemoryProvider
 */
let _provider: MixologyBackendProvider | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Gets the singleton backend provider instance.
 * Automatically initializes on first call.
 */
export async function getBackendProvider(): Promise<MixologyBackendProvider> {
  if (!_provider) {
    // CONFIGURATION POINT: Change this line to switch backends
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
export function getBackendProviderSync(): MixologyBackendProvider {
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
