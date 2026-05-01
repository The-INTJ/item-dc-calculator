import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseAdminAppMocks = vi.hoisted(() => ({
  cert: vi.fn((input: unknown) => ({ credential: input })),
  getApps: vi.fn(() => []),
  initializeApp: vi.fn((options: unknown) => ({ options })),
}));

const firebaseAdminAuthMocks = vi.hoisted(() => ({
  getAuth: vi.fn(() => ({ kind: 'auth' })),
}));

const firebaseAdminFirestoreMocks = vi.hoisted(() => ({
  getFirestore: vi.fn(() => ({ kind: 'firestore' })),
}));

vi.mock('firebase-admin/app', () => firebaseAdminAppMocks);
vi.mock('firebase-admin/auth', () => firebaseAdminAuthMocks);
vi.mock('firebase-admin/firestore', () => firebaseAdminFirestoreMocks);

describe('Firebase Admin initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    firebaseAdminAppMocks.cert.mockClear();
    firebaseAdminAppMocks.getApps.mockClear();
    firebaseAdminAppMocks.getApps.mockReturnValue([]);
    firebaseAdminAppMocks.initializeApp.mockClear();
    firebaseAdminAuthMocks.getAuth.mockClear();
    firebaseAdminFirestoreMocks.getFirestore.mockClear();
  });

  it('does not parse service account JSON while running against emulators', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIREBASE_EMULATORS', 'true');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'playground-69cbc');
    vi.stubEnv('FIREBASE_ADMIN_SERVICE_ACCOUNT', '{"type":"service_account",...}');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getFirebaseAdminFirestore } = await import('./admin');

    expect(getFirebaseAdminFirestore()).toEqual({ kind: 'firestore' });
    expect(firebaseAdminAppMocks.cert).not.toHaveBeenCalled();
    expect(firebaseAdminAppMocks.initializeApp).toHaveBeenCalledWith({
      projectId: 'playground-69cbc',
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('reports malformed service account JSON only once outside emulator mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_FIREBASE_EMULATORS', 'false');
    vi.stubEnv('FIREBASE_ADMIN_SERVICE_ACCOUNT', '{"type":"service_account",...}');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getFirebaseAdminAuth, isFirebaseAdminConfigured } = await import('./admin');

    expect(isFirebaseAdminConfigured()).toBe(false);
    expect(isFirebaseAdminConfigured()).toBe(false);
    expect(getFirebaseAdminAuth()).toBeNull();

    const parseWarnings = errorSpy.mock.calls.filter(([message]) =>
      String(message).includes('Unable to parse FIREBASE_ADMIN_SERVICE_ACCOUNT'),
    );
    expect(parseWarnings).toHaveLength(1);
    expect(firebaseAdminAppMocks.initializeApp).not.toHaveBeenCalled();
  });
});
