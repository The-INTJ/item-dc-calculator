/**
 * Auth and session types for Mixology.
 *
 * Supports both guest (anonymous) and authenticated users.
 * Guest data is stored locally and can be migrated to Firebase
 * when the user creates an account.
 */

import type { JudgeRole } from '../types';

/**
 * User account status
 */
export type UserStatus = 'guest' | 'registered' | 'synced';

/**
 * A vote submitted by a user
 */
export interface UserVote {
  contestId: string;
  drinkId: string;
  score: number;
  breakdown?: {
    aroma: number;
    balance: number;
    presentation: number;
    creativity: number;
    overall: number;
  };
  notes?: string;
  timestamp: number;
}

/**
 * Pending data that needs to sync to Firebase
 */
export interface PendingSync {
  votes: UserVote[];
  profileUpdates?: Partial<UserProfile>;
  lastAttempt?: number;
  failureCount?: number;
}

/**
 * User profile data
 */
export interface UserProfile {
  displayName: string;
  email?: string;
  role: JudgeRole;
  avatarUrl?: string;
}

/**
 * Session state stored locally (localStorage)
 */
export interface LocalSession {
  /** Unique session/device ID */
  sessionId: string;

  /** User status */
  status: UserStatus;

  /** Firebase UID if registered */
  firebaseUid?: string;

  /** User profile */
  profile: UserProfile;

  /** Current contest being viewed */
  currentContestId?: string;

  /** Last visited page path */
  lastPath?: string;

  /** Votes submitted (synced or pending) */
  votes: UserVote[];

  /** Data pending sync to Firebase */
  pendingSync?: PendingSync;

  /** Session creation timestamp */
  createdAt: number;

  /** Last activity timestamp */
  updatedAt: number;
}

/**
 * Registration data for creating an account
 */
export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Auth state exposed to components
 */
export interface AuthState {
  /** Whether auth is still initializing */
  loading: boolean;

  /** Current session */
  session: LocalSession | null;

  /** Whether user is logged in (registered) */
  isAuthenticated: boolean;

  /** Whether user is a guest */
  isGuest: boolean;

  /** User's role */
  role: JudgeRole | null;
}

/**
 * Auth actions available to components
 */
export interface AuthActions {
  /** Start a guest session */
  startGuestSession: (displayName?: string) => Promise<void>;

  /** Register a new account (migrates guest data) */
  register: (data: RegistrationData) => Promise<{ success: boolean; error?: string }>;

  /** Log in with existing account */
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;

  /** Log out (keeps guest data locally) */
  logout: () => Promise<void>;

  /** Update profile */
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  /** Record a vote */
  recordVote: (vote: Omit<UserVote, 'timestamp'>) => Promise<void>;

  /** Update last visited path */
  updateLastPath: (path: string) => void;

  /** Force sync pending data */
  syncPendingData: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Combined auth context value
 */
export type AuthContextValue = AuthState & AuthActions;
