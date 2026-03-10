import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

interface ServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

let cachedAuth: Auth | null = null;
let initAttempted = false;

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

export function isFirebaseAdminConfigured(): boolean {
  return loadServiceAccountFromEnv() !== null;
}

function getOrInitApp(config: ServiceAccountConfig): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  return initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
  });
}

export function getFirebaseAdminAuth(): Auth | null {
  if (cachedAuth) {
    return cachedAuth;
  }

  if (initAttempted) {
    return null;
  }

  initAttempted = true;
  const config = loadServiceAccountFromEnv();

  if (!config) {
    return null;
  }

  try {
    const app = getOrInitApp(config);
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (error) {
    console.error('[FirebaseAdmin] Failed to initialize Firebase Admin SDK.', error);
    return null;
  }
}
