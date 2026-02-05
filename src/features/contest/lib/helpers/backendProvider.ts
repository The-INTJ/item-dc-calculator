/**
 * Backend provider singleton.
 */

import { createFirebaseBackendProvider } from '../firebase/firebaseBackendProvider';
import type { MixologyBackendProvider } from './types';

let _provider: MixologyBackendProvider | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Gets the singleton backend provider instance.
 */
export async function getBackendProvider(): Promise<MixologyBackendProvider> {
  if (!_provider) {
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
