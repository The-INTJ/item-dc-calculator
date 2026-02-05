/**
 * Minimal auth storage layer - cloud-only.
 * 
 * Firebase Auth handles token persistence automatically.
 * All user data, votes, and profiles are fetched from Firestore.
 * No local storage of contest data or user state.
 */

import type { LocalSession, UserProfile } from './types';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a minimal session for authenticated users.
 * All data will be fetched from cloud.
 */
interface CreateSessionOptions {
  firebaseUid: string;
  profile: UserProfile;
}

export function createCloudSession(options: CreateSessionOptions): LocalSession {
  const now = Date.now();
  return {
    sessionId: generateSessionId(),
    status: 'synced',
    firebaseUid: options.firebaseUid,
    profile: options.profile,
    votes: [], // Will be fetched from Firestore
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a fresh guest session - minimal, cloud will be synced immediately.
 */
interface CreateGuestSessionOptions {
  displayName?: string;
  guestId?: string;
}

export function createGuestSession(options: CreateGuestSessionOptions = {}): LocalSession {
  const now = Date.now();
  return {
    sessionId: generateSessionId(),
    status: 'guest',
    profile: {
      displayName: options.displayName ?? `Guest_${Math.random().toString(36).substring(2, 6)}`,
      role: 'viewer',
    },
    guestIdentity: options.guestId
      ? { guestId: options.guestId, guestIndex: undefined }
      : undefined,
    votes: [], // Will be synced to Firestore
    createdAt: now,
    updatedAt: now,
  };
}

// All other storage functions are removed - data comes from cloud only
// Firebase Auth handles its own token persistence
