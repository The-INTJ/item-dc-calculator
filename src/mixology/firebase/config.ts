/**
 * Firebase configuration
 *
 * Reads from environment variables. Set these in:
 * - .env.local (local dev, gitignored by Next.js)
 * - Vercel environment variables (production)
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function initializeFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null } {
  // Server-side: don't initialize
  if (typeof window === 'undefined') {
    return { app: null, auth: null, db: null };
  }

  // Already initialized
  if (app && auth && db) {
    return { app, auth, db };
  }

  // Check for required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('[Firebase] Missing configuration. Check .env.local file.');
    console.error('[Firebase] Required: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    return { app: null, auth: null, db: null };
  }

  // Initialize or get existing app
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized app:', firebaseConfig.projectId);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);

  return { app, auth, db };
}

export { initializeFirebase, firebaseConfig };
export type { FirebaseApp, Auth, Firestore };
