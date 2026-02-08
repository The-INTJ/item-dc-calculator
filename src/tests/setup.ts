/**
 * Global test setup for Vitest.
 *
 * Note: We don't reset the backend provider between tests because the
 * JSON-driven story tests use beforeAll/afterAll for setup/teardown
 * within each describe block. Resetting in beforeEach would clear the
 * setup data before the main test runs.
 *
 * Each story test is responsible for its own cleanup via teardown actions.
 */

import { beforeAll, afterAll } from 'vitest';
import { getBackendProvider, resetBackendProvider } from '../features/contest/lib/helpers/backendProvider';
import { enableMockServer, disableMockServer } from './stories/mockServer';

// Enable mock server for all tests
beforeAll(async () => {
  enableMockServer();
  // Initialize the backend provider once
  await getBackendProvider();
});

afterAll(async () => {
  disableMockServer();
  // Clean up at the very end
  await resetBackendProvider();
});
