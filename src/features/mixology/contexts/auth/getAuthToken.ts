/**
 * Get the current user's ID token for API authorization.
 */

import { getAuth } from 'firebase/auth';

export async function getAuthToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}
