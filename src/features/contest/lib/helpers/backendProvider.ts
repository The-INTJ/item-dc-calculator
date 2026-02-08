/**
 * Backend provider singleton with environment-based provider selection.
 */

import { createFirebaseBackendProvider } from '../firebase/firebaseBackendProvider';
import { createInMemoryBackendProvider } from '../inmemory/inMemoryBackendProvider';
import type { BackendProvider } from './types';

let _provider: BackendProvider | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Determines which provider to use based on environment.
 */
function createProvider(): BackendProvider {
  // Use in-memory for testing
  if (
    process.env.USE_MOCK_BACKEND === 'true' ||
    process.env.NODE_ENV === 'test'
  ) {
    console.log('[BackendProvider] Using in-memory provider');
    return createInMemoryBackendProvider();
  }

  // Default to Firebase for production/development
  return createFirebaseBackendProvider();
}

/**
 * Gets the singleton backend provider instance.
 */
export async function getBackendProvider(): Promise<BackendProvider> {
  if (!_provider) {
    _provider = createProvider();
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
 * Resets the provider singleton (useful for testing).
 */
export async function resetBackendProvider(): Promise<void> {
  if (_provider) {
    await _provider.dispose();
    _provider = null;
    _initPromise = null;
  }
}

/**
 * Sets a custom provider (for testing with mocks).
 */
export function setBackendProvider(provider: BackendProvider): void {
  _provider = provider;
  _initPromise = null;
}
