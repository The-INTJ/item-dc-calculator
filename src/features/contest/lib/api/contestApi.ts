import { profileApi } from './profileApi';
import { contestsApi } from './contestsApi';
import { contestantsApi } from './contestantsApi';
import { scoresApi } from './scoresApi';
import { matchupsApi } from './matchupsApi';

/**
 * Unified client for the contest API. Every method returns a `ProviderResult`,
 * so callers handle success/error uniformly (and can't confuse "not loaded"
 * with "failed"). There is no separate admin client — admin-only endpoints
 * enforce their own auth server-side via `requireAdmin`.
 *
 * Composed from one resource module per API concept (profiles, contests,
 * contestants, scores, matchups/rounds); this object is the public seam.
 */
export const contestApi = {
  ...profileApi,
  ...contestsApi,
  ...contestantsApi,
  ...scoresApi,
  ...matchupsApi,
};
