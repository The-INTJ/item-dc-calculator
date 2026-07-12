/**
 * Machine-readable error codes shared between API routes and the client.
 *
 * Codes ride alongside the human-readable `message` in error responses
 * (`jsonError(message, status, code)`) and surface on the client as
 * `ProviderResult.errorCode`. Keep this set minimal — only codes the client
 * actually branches on belong here.
 */

/** The matchup is no longer (or not yet) open for scoring. */
export const MATCHUP_CLOSED = 'MATCHUP_CLOSED';

/** A score breakdown failed validation against the contest config. */
export const SCORE_INVALID = 'SCORE_INVALID';

export type ContestErrorCode = typeof MATCHUP_CLOSED | typeof SCORE_INVALID;
