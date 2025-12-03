/**
 * Local storage persistence layer for session data.
 *
 * Uses localStorage to persist guest/user session data.
 * Provides a clean API for reading/writing session state.
 */

import type { LocalSession, UserVote, UserProfile, PendingSync } from './types';

const STORAGE_KEY = 'mixology_session';
const SESSION_VERSION = 1;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a fresh guest session
 */
export function createGuestSession(displayName?: string): LocalSession {
  const now = Date.now();
  return {
    sessionId: generateSessionId(),
    status: 'guest',
    profile: {
      displayName: displayName ?? `Guest_${Math.random().toString(36).substring(2, 6)}`,
      role: 'viewer',
    },
    votes: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Read session from localStorage
 */
export function readSession(): LocalSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Version check - if structure changes, we can migrate here
    if (parsed._version !== SESSION_VERSION) {
      // For now, just return null to create fresh session
      return null;
    }

    return parsed.session as LocalSession;
  } catch {
    console.warn('Failed to read session from localStorage');
    return null;
  }
}

/**
 * Write session to localStorage
 */
export function writeSession(session: LocalSession): void {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      _version: SESSION_VERSION,
      session: {
        ...session,
        updatedAt: Date.now(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write session to localStorage:', err);
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Update specific fields in the session
 */
export function updateSession(updates: Partial<LocalSession>): LocalSession | null {
  const current = readSession();
  if (!current) return null;

  const updated = { ...current, ...updates, updatedAt: Date.now() };
  writeSession(updated);
  return updated;
}

/**
 * Add a vote to the session
 */
export function addVoteToSession(vote: UserVote): LocalSession | null {
  const current = readSession();
  if (!current) return null;

  // Check if vote already exists for this drink (update it)
  const existingIdx = current.votes.findIndex(
    (v) => v.contestId === vote.contestId && v.drinkId === vote.drinkId
  );

  const newVotes = [...current.votes];
  if (existingIdx >= 0) {
    newVotes[existingIdx] = vote;
  } else {
    newVotes.push(vote);
  }

  // If user is a guest or not synced, add to pending sync
  let pendingSync = current.pendingSync;
  if (current.status !== 'synced') {
    pendingSync = {
      ...pendingSync,
      votes: [...(pendingSync?.votes ?? []), vote],
    };
  }

  const updated: LocalSession = {
    ...current,
    votes: newVotes,
    pendingSync,
    updatedAt: Date.now(),
  };

  writeSession(updated);
  return updated;
}

/**
 * Update profile in session
 */
export function updateProfileInSession(updates: Partial<UserProfile>): LocalSession | null {
  const current = readSession();
  if (!current) return null;

  // If not synced, add to pending sync
  let pendingSync = current.pendingSync;
  if (current.status !== 'synced') {
    pendingSync = {
      ...pendingSync,
      votes: pendingSync?.votes ?? [],
      profileUpdates: { ...pendingSync?.profileUpdates, ...updates },
    };
  }

  const updated: LocalSession = {
    ...current,
    profile: { ...current.profile, ...updates },
    pendingSync,
    updatedAt: Date.now(),
  };

  writeSession(updated);
  return updated;
}

/**
 * Mark data as synced (clear pending sync)
 */
export function markAsSynced(firebaseUid: string): LocalSession | null {
  const current = readSession();
  if (!current) return null;

  const updated: LocalSession = {
    ...current,
    status: 'synced',
    firebaseUid,
    pendingSync: undefined,
    updatedAt: Date.now(),
  };

  writeSession(updated);
  return updated;
}

/**
 * Get pending sync data
 */
export function getPendingSync(): PendingSync | null {
  const current = readSession();
  return current?.pendingSync ?? null;
}

/**
 * Clear pending sync data after successful sync
 */
export function clearPendingSync(): void {
  const current = readSession();
  if (!current) return;

  const updated: LocalSession = {
    ...current,
    pendingSync: undefined,
    updatedAt: Date.now(),
  };

  writeSession(updated);
}

/**
 * Record sync failure
 */
export function recordSyncFailure(): void {
  const current = readSession();
  if (!current?.pendingSync) return;

  const updated: LocalSession = {
    ...current,
    pendingSync: {
      ...current.pendingSync,
      lastAttempt: Date.now(),
      failureCount: (current.pendingSync.failureCount ?? 0) + 1,
    },
    updatedAt: Date.now(),
  };

  writeSession(updated);
}

/**
 * Upgrade guest session to registered
 */
export function upgradeToRegistered(firebaseUid: string, profile?: Partial<UserProfile>): LocalSession | null {
  const current = readSession();
  if (!current) return null;

  const updated: LocalSession = {
    ...current,
    status: 'registered',
    firebaseUid,
    profile: { ...current.profile, ...profile },
    updatedAt: Date.now(),
  };

  writeSession(updated);
  return updated;
}
