/**
 * Server-side authentication utilities
 *
 * Provides server-side functions to check authentication status.
 * For use in server components and API routes.
 */

import { cookies } from 'next/headers';
import type { UserProfile } from '../contexts/auth/types';
import type { JudgeRole } from '../types';
import { getFirebaseAdminAuth } from './firebase/admin';

const JUDGE_ROLES: JudgeRole[] = ['admin', 'judge', 'viewer'];

function resolveRoleFromClaims(claims: Record<string, unknown>): JudgeRole {
  const rawRole =
    (typeof claims.role === 'string' && claims.role) ||
    (typeof claims.mixologyRole === 'string' && claims.mixologyRole) ||
    (claims.admin === true && 'admin') ||
    'viewer';

  if (JUDGE_ROLES.includes(rawRole as JudgeRole)) {
    return rawRole as JudgeRole;
  }

  return 'viewer';
}

async function buildUserProfile(uid: string, claims: Record<string, unknown>): Promise<UserProfile | null> {
  const adminAuth = getFirebaseAdminAuth();

  if (!adminAuth) {
    return null;
  }

  const userRecord = await adminAuth.getUser(uid);

  return {
    displayName: userRecord.displayName ?? 'User',
    email: userRecord.email ?? undefined,
    role: resolveRoleFromClaims(claims),
    avatarUrl: userRecord.photoURL ?? undefined,
  };
}

/**
 * Get the current user from the server side.
 * 
 * This checks for Firebase auth tokens in cookies and validates them.
 * Returns null if the user is not authenticated.
 * 
 * Note: This is a simplified implementation. In production, you would:
 * - Use Firebase Admin SDK to verify the session cookie
 * - Validate the token with Firebase
 * - Fetch user data from Firestore
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    
    // Check for Firebase session cookie or auth token
    // Firebase typically uses __session cookie for server-side auth
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
    return await buildUserProfile(decodedClaims.uid, decodedClaims);
  } catch (error) {
    console.error('[ServerAuth] Error getting current user:', error);
    return null;
  }
}

export async function getCurrentUserFromRequest(request: Request): Promise<UserProfile | null> {
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
      return await buildUserProfile(decodedClaims.uid, decodedClaims);
    } catch (error) {
      console.error('[ServerAuth] Error verifying ID token:', error);
      return null;
    }
  }

  return getCurrentUser();
}
