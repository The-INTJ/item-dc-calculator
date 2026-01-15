/**
 * Auth module index
 */

// Types
export type {
  UserStatus,
  UserVote,
  PendingSync,
  UserProfile,
  LocalSession,
  RegistrationData,
  LoginCredentials,
  AuthState,
  AuthActions,
  AuthContextValue,
  GuestSessionResult,
} from './types';

// Context and hooks
export { MixologyAuthProvider, useAuth } from './AuthContext';

// Storage utilities (for advanced use cases)
export {
  readSession,
  writeSession,
  clearSession,
  createGuestSession,
  setInviteContext,
} from './storage';

export {
  getGuestId,
  setGuestId,
  getGuestIndex,
  setGuestIndex,
  addGuestToIndex,
  ensureGuestIdentity,
  clearGuestIdentity,
  getInviteContextCookie,
  setInviteContextCookie,
} from './cookies';

export { parseInviteSearchParams } from './invite';

// Provider interface (for implementing custom backends)
export type { AuthProvider, AuthResult } from './provider';
