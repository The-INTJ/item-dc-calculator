import { createFirebaseBackendProvider } from './firebaseBackendProvider';
import type { BackendProvider } from '../helpers/types';

let providerPromise: Promise<BackendProvider> | null = null;

export async function getClientBackendProvider(): Promise<BackendProvider> {
  if (!providerPromise) {
    providerPromise = (async () => {
      const provider = createFirebaseBackendProvider();
      const result = await provider.initialize();

      if (!result.success) {
        throw new Error(result.error ?? 'Failed to initialize Firebase backend');
      }

      return provider;
    })();
  }

  return providerPromise;
}
