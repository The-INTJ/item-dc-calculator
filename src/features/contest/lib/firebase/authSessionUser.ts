/**
 * Module-level handle to the signed-in Firebase user.
 *
 * Shared by the auth provider, the sign-in flows, and the standalone token
 * accessor so they all observe the same session regardless of which module
 * touched it last.
 */

import type { User } from 'firebase/auth';

let currentUser: User | null = null;

export function getSessionUser(): User | null {
  return currentUser;
}

export function setSessionUser(user: User | null): void {
  currentUser = user;
}
