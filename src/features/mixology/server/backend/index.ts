/**
 * Backend provider singleton and context.
 *
 * This module provides a singleton instance of the backend provider
 * and a React context for accessing it throughout the application.
 * 
 * Uses Firebase backend provider for cloud data persistence.
 */

import { createFirebaseBackendProvider } from '../firebase/firebaseBackendProvider';
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
  JudgesProvider,
  ScoresProvider,
} from './types';

/**
 * Currently configured backend provider.
 * 
 * Server-side (API routes): Uses in-memory provider
 * Client-side (React): Auth uses Firebase, data via API routes
 */
let _provider: MixologyBackendProvider | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Gets the singleton backend provider instance.
 * Automatically initializes on first call.
 */
export async function getBackendProvider(): Promise<MixologyBackendProvider> {
  if (!_provider) {
    // Use Firebase provider for cloud data persistence
    _provider = createFirebaseBackendProvider();
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
