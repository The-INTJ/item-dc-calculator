'use client';

import { useAuth } from '@/contest/contexts/auth/AuthContext';

import { deriveViewer } from '../lib/policy';
import type { TracerGame } from '../lib/types';

/**
 * Who this browser is: the signed-in uid (if any), the name to offer by
 * default, and a way to become a player — signing in as a guest under the
 * chosen name when there is no session yet.
 */
export function usePlayerIdentity() {
  const { session, loading, startGuestSession } = useAuth();
  const uid = session?.firebaseUid ?? null;

  async function ensurePlayer(name: string): Promise<{ ok: true } | { ok: false; message: string }> {
    if (session) return { ok: true };
    const result = await startGuestSession(name);
    return result.success ? { ok: true } : { ok: false, message: result.error ?? 'Could not sign in.' };
  }

  return {
    uid,
    loading,
    defaultName: session?.profile.displayName ?? '',
    ensurePlayer,
  };
}

/** The identity plus what it may do in `game`. */
export function useViewer(game: TracerGame) {
  const identity = usePlayerIdentity();
  return { ...identity, viewer: deriveViewer(game, identity.uid) };
}
