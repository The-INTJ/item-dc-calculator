/**
 * Invite parsing helpers for Mixology.
 */

import type { InviteContext } from './types';

export function parseInviteSearchParams(params: URLSearchParams): InviteContext | null {
  const inviteId = params.get('invite')?.trim();
  if (!inviteId) return null;

  const contestSlug = params.get('contest')?.trim() || undefined;
  const source = params.get('source')?.trim() || params.get('src')?.trim() || undefined;

  return {
    inviteId,
    contestSlug,
    source,
    receivedAt: Date.now(),
  };
}
