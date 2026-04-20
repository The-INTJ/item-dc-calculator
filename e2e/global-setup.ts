/**
 * Captures authenticated browser contexts for each seeded test user.
 *
 * How it works:
 * 1. Calls the Firebase Auth emulator's REST sign-in endpoint (the same
 *    endpoint the Firebase Web SDK hits internally when signing in).
 * 2. Injects the resulting auth state into Firebase's IndexedDB format via
 *    page.addInitScript, BEFORE the app's Firebase instance initializes.
 * 3. Navigates to /account, waits for the session to settle, then saves
 *    context storageState (with indexedDB) to e2e/.auth/<label>.json.
 *
 * This is test INFRASTRUCTURE (auth seeding). Specs still drive the app
 * through real UI surfaces — see e2e/README.md no-drift rule.
 */

import { chromium, type FullConfig } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const API_KEY = 'fake-api-key';
const BASE_URL = 'http://127.0.0.1:3000';

const USERS = [
  { label: 'admin', email: 'admin@test.com', password: 'admin123' },
  { label: 'voter1', email: 'voter1@test.com', password: 'voter123' },
  { label: 'voter2', email: 'voter2@test.com', password: 'voter123' },
  { label: 'voter3', email: 'voter3@test.com', password: 'voter123' },
];

interface SignInResponse {
  localId: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

async function signInViaEmulator(
  email: string,
  password: string,
): Promise<SignInResponse> {
  const url = `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`signIn ${email} failed: ${res.status} ${body}`);
  }
  return (await res.json()) as SignInResponse;
}

function buildFirebaseAuthRecord(token: SignInResponse, apiKey: string) {
  const now = Date.now();
  return {
    uid: token.localId,
    email: token.email,
    emailVerified: false,
    displayName: token.displayName ?? null,
    isAnonymous: false,
    photoURL: null,
    providerData: [
      {
        providerId: 'password',
        uid: token.email,
        displayName: token.displayName ?? null,
        email: token.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: token.refreshToken,
      accessToken: token.idToken,
      expirationTime: now + Number(token.expiresIn) * 1000,
    },
    createdAt: String(now),
    lastLoginAt: String(now),
    apiKey,
    appName: '[DEFAULT]',
  };
}

export default async function globalSetup(_config: FullConfig) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const authDir = path.join(here, '.auth');
  await mkdir(authDir, { recursive: true });

  console.log('[global-setup] Capturing auth state for test users...');

  const browser = await chromium.launch();

  try {
    for (const user of USERS) {
      const token = await signInViaEmulator(user.email, user.password);
      const authRecord = buildFirebaseAuthRecord(token, API_KEY);

      const context = await browser.newContext();
      const page = await context.newPage();

      await page.addInitScript(
        ({ record, apiKey }) => {
          const dbName = 'firebaseLocalStorageDb';
          const storeName = 'firebaseLocalStorage';
          const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
          return new Promise<void>((resolve, reject) => {
            const req = indexedDB.open(dbName, 1);
            req.onupgradeneeded = () => {
              const db = req.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'fbase_key' });
              }
            };
            req.onsuccess = () => {
              const db = req.result;
              try {
                const tx = db.transaction(storeName, 'readwrite');
                tx.objectStore(storeName).put({ fbase_key: key, value: record });
                tx.oncomplete = () => {
                  db.close();
                  resolve();
                };
                tx.onerror = () => {
                  db.close();
                  reject(tx.error);
                };
              } catch (err) {
                db.close();
                reject(err);
              }
            };
            req.onerror = () => reject(req.error);
          });
        },
        { record: authRecord, apiKey: API_KEY },
      );

      await page.goto(`${BASE_URL}/account`, { waitUntil: 'domcontentloaded' });
      await page
        .getByText(/Firebase UID:/i)
        .waitFor({ state: 'visible', timeout: 30_000 });

      const storagePath = path.join(authDir, `${user.label}.json`);
      await context.storageState({ path: storagePath, indexedDB: true });
      console.log(`[global-setup]   ${user.label} → ${storagePath}`);

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log('[global-setup] Done.');
}
