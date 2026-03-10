/**
 * Server-side authentication utilities.
 *
 * Provides server-side functions to check authentication status.
 * For use in server components and API routes.
 */

import { cookies } from 'next/headers';
import type { UserProfile } from '../../contexts/auth/types';
import type { UserRole } from '../../contexts/contest/contestTypes';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '../firebase/admin';

const USER_ROLES: UserRole[] = ['admin', 'voter', 'competitor'];
const USERS_COLLECTION = 'users';

export interface AuthenticatedUser {
  uid: string;
  profile: UserProfile;
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

function resolveRoleFromClaims(claims: Record<string, unknown>): UserRole | null {
  const rawRole =
    (typeof claims.role === 'string' && claims.role) ||
    (typeof claims.contestRole === 'string' && claims.contestRole) ||
    (claims.admin === true && 'admin') ||
    null;

  return isUserRole(rawRole) ? rawRole : null;
}

async function loadUserProfileDoc(uid: string): Promise<Partial<UserProfile> | null> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return null;
  }

  try {
    const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() as Record<string, unknown>;
    return {
      ...(typeof data.displayName === 'string' ? { displayName: data.displayName } : {}),
      ...(typeof data.email === 'string' ? { email: data.email } : {}),
      ...(typeof data.avatarUrl === 'string' ? { avatarUrl: data.avatarUrl } : {}),
      ...(isUserRole(data.role) ? { role: data.role } : {}),
    };
  } catch (error) {
    console.error('[ServerAuth] Error reading user profile from Firestore:', error);
    return null;
  }
}

async function buildAuthenticatedUser(uid: string, claims: Record<string, unknown>): Promise<AuthenticatedUser | null> {
  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return null;
  }

  const [userRecord, profileDoc] = await Promise.all([
    adminAuth.getUser(uid),
    loadUserProfileDoc(uid),
  ]);

  const roleFromClaims = resolveRoleFromClaims(claims);
  const profile: UserProfile = {
    displayName: profileDoc?.displayName ?? userRecord.displayName ?? 'User',
    email: profileDoc?.email ?? userRecord.email ?? undefined,
    role: roleFromClaims ?? profileDoc?.role ?? 'voter',
    avatarUrl: profileDoc?.avatarUrl ?? userRecord.photoURL ?? undefined,
  };

  return { uid, profile };
}

/**
 * Get the current authenticated user from the server side.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return null;
    }

    const adminAuth = getFirebaseAdminAuth();
    if (!adminAuth) {
      console.warn('[ServerAuth] Firebase Admin SDK is not configured.');
      return null;
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return await buildAuthenticatedUser(decodedClaims.uid, decodedClaims);
  } catch (error) {
    console.error('[ServerAuth] Error getting current user:', error);
    return null;
  }
}

export async function getAuthenticatedUserFromRequest(request: Request): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (!token) {
      return null;
    }

    const adminAuth = getFirebaseAdminAuth();
    if (!adminAuth) {
      console.warn('[ServerAuth] Firebase Admin SDK is not configured.');
      return null;
    }

    try {
      const decodedClaims = await adminAuth.verifyIdToken(token, true);
      return await buildAuthenticatedUser(decodedClaims.uid, decodedClaims);
    } catch (error) {
      console.error('[ServerAuth] Error verifying ID token:', error);
      return null;
    }
  }

  return getAuthenticatedUser();
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const user = await getAuthenticatedUser();
  return user?.profile ?? null;
}

export async function getCurrentUserFromRequest(request: Request): Promise<UserProfile | null> {
  const user = await getAuthenticatedUserFromRequest(request);
  return user?.profile ?? null;
}

