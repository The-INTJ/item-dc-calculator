/**
 * Session creation utilities - cloud-only.
 */

import type { Session, UserProfile, UserStatus } from './types';

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

interface CreateSessionOptions {
  firebaseUid: string;
  profile: UserProfile;
  status?: UserStatus;
}

export function createSession(options: CreateSessionOptions): Session {
  const now = Date.now();
  return {
    sessionId: generateSessionId(),
    status: options.status ?? 'authenticated',
    firebaseUid: options.firebaseUid,
    profile: options.profile,
    createdAt: now,
    updatedAt: now,
  };
}
