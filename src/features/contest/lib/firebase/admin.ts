import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

interface ServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

function loadServiceAccountFromEnv(): ServiceAccountConfig | null {
  const rawServiceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (rawServiceAccount) {
    try {
      const parsed = JSON.parse(rawServiceAccount) as {
        project_id?: string;
        projectId?: string;
        client_email?: string;
        clientEmail?: string;
        private_key?: string;
        privateKey?: string;
      };

      const projectId = parsed.project_id ?? parsed.projectId;
      const clientEmail = parsed.client_email ?? parsed.clientEmail;
      const privateKey = parsed.private_key ?? parsed.privateKey;

      if (!projectId || !clientEmail || !privateKey) {
        return null;
      }

      return {
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
      };
    } catch (error) {
      console.error('[FirebaseAdmin] Unable to parse FIREBASE_ADMIN_SERVICE_ACCOUNT.', error);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

function shouldUseEmulators(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
}

function ensureEmulatorEnv(): void {
  if (!shouldUseEmulators()) {
    return;
  }

  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
}

function resolveProjectId(): string | null {
  return (
    loadServiceAccountFromEnv()?.projectId ??
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    null
  );
}

export function isFirebaseAdminConfigured(): boolean {
  return loadServiceAccountFromEnv() !== null || resolveProjectId() !== null;
}

function getOrInitApp(): App | null {
  if (cachedApp) {
    return cachedApp;
  }

  const existingApp = getApps()[0];
  if (existingApp) {
    cachedApp = existingApp;
    return cachedApp;
  }

  ensureEmulatorEnv();

  const serviceAccount = loadServiceAccountFromEnv();
  if (serviceAccount) {
    cachedApp = initializeApp({
      credential: cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),
      projectId: serviceAccount.projectId,
    });
    return cachedApp;
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return null;
  }

  try {
    cachedApp = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
    return cachedApp;
  } catch (error) {
    console.warn('[FirebaseAdmin] Falling back to projectId-only initialization.', error);
    try {
      cachedApp = initializeApp({ projectId });
      return cachedApp;
    } catch (fallbackError) {
      console.error('[FirebaseAdmin] Failed to initialize Firebase Admin SDK.', fallbackError);
      return null;
    }
  }
}

export function getFirebaseAdminAuth(): Auth | null {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getOrInitApp();
  if (!app) {
    return null;
  }

  try {
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (error) {
    console.error('[FirebaseAdmin] Failed to initialize Auth.', error);
    return null;
  }
}

export function getFirebaseAdminDb(): Firestore | null {
  if (cachedDb) {
    return cachedDb;
  }

  const app = getOrInitApp();
  if (!app) {
    return null;
  }

  try {
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (error) {
    console.error('[FirebaseAdmin] Failed to initialize Firestore.', error);
    return null;
  }
}

