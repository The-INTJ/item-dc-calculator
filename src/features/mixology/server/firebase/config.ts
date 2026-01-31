/**
 * Firebase configuration
 *
 * Reads from environment variables. Set these in:
 * - .env.local (local dev, gitignored by Next.js)
 * - Vercel environment variables (production)
 *
 * Note: Next.js inlines NEXT_PUBLIC_* variables at build time,
 * so we access them directly rather than via dynamic lookup.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

// Access env vars directly so Next.js can inline them at build time
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Check if Firebase is configured with required env vars.
 * Uses the already-resolved config object (inlined at build time).
 */
function isFirebaseConfigured(): boolean {
  const { apiKey, authDomain, projectId, appId } = firebaseConfig;
  return Boolean(
    apiKey?.trim() &&
    authDomain?.trim() &&
    projectId?.trim() &&
    appId?.trim()
  );
}

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function initializeFirebase(): { 
  app: FirebaseApp | null; 
  auth: Auth | null; 
  db: Firestore | null;
} {
  // Already initialized
  if (app && db) {
    return { app, auth, db };
  }

  // Check for required config
  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Missing configuration. Falling back to local-only mode.');
    console.warn('[Firebase] Ensure NEXT_PUBLIC_FIREBASE_* env vars are set in .env.local');
    return { app: null, auth: null, db: null };
  }

  // Initialize or get existing app
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized app:', firebaseConfig.projectId);
  } else {
    app = getApps()[0];
  }

  // Auth is only available client-side
  if (typeof window !== 'undefined') {
    auth = getAuth(app);
  }
  
  db = getFirestore(app);

  // Connect to emulators if enabled (dev only)
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    // Guard so Next/React strict mode / HMR doesn't reconnect repeatedly
    if (!(globalThis as any).__fbEmulatorsConnected) {
      console.log('[Firebase] Connecting to emulators...');
      
      if (auth) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('[Firebase] Connected to Auth Emulator');
      }
      
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      console.log('[Firebase] Connected to Firestore Emulator');

      (globalThis as any).__fbEmulatorsConnected = true;
    }
  }

  return { app, auth, db };
}

export { initializeFirebase, firebaseConfig, isFirebaseConfigured };
export type { FirebaseApp, Auth, Firestore };
