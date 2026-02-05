/**
 * Firebase module index
 */

export { initializeFirebase, firebaseConfig } from './config';
export { createFirebaseAuthProvider } from './firebaseAuthProvider';
export { createFirebaseBackendProvider } from './firebaseBackendProvider';
export { registerGuestIdentity, type GuestRegistrationResult } from './guest';
