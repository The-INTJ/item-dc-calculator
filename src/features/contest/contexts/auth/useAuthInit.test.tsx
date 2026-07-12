import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthInit } from './useAuthInit';
import type { AuthProvider } from './provider';

const getProfileMock = vi.fn();
const registerProfileMock = vi.fn();
const syncSessionCookieMock = vi.fn();

vi.mock('../../lib/api/contestApi', () => ({
  contestApi: {
    getProfile: (...args: unknown[]) => getProfileMock(...args),
    registerProfile: (...args: unknown[]) => registerProfileMock(...args),
  },
}));

vi.mock('./sessionSync', () => ({
  syncSessionCookie: (...args: unknown[]) => syncSessionCookieMock(...args),
}));

function makeProvider(overrides: Partial<AuthProvider>): AuthProvider {
  return {
    name: 'test',
    initialize: vi.fn().mockResolvedValue(undefined),
    register: vi.fn(),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginAnonymously: vi.fn(),
    linkWithEmail: vi.fn(),
    linkWithGoogle: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: () => true,
    isAnonymous: () => false,
    getCurrentUid: () => 'uid-1',
    getCurrentEmail: () => null,
    getCurrentDisplayName: () => null,
    getIdToken: vi.fn().mockResolvedValue('token-1'),
    onIdTokenChanged: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

describe('useAuthInit', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
    registerProfileMock.mockReset();
    syncSessionCookieMock.mockReset();
    getProfileMock.mockResolvedValue({
      success: true,
      data: { displayName: 'Rehydrated', role: 'voter' },
    });
  });

  it('rehydrates anonymous Firebase users as GUESTS, not authenticated', async () => {
    const dispatch = vi.fn();
    const provider = makeProvider({ isAnonymous: () => true });

    renderHook(() => useAuthInit({ provider, dispatch }));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'GUEST' }),
      );
    });
    const action = dispatch.mock.calls.find(([a]) => a.type === 'GUEST')?.[0];
    expect(action.session.status).toBe('guest');
    expect(action.session.firebaseUid).toBe('uid-1');
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'AUTHENTICATED' }),
    );
  });

  it('rehydrates credentialed users as AUTHENTICATED', async () => {
    const dispatch = vi.fn();
    const provider = makeProvider({
      isAnonymous: () => false,
      getCurrentEmail: () => 'user@test.com',
    });

    renderHook(() => useAuthInit({ provider, dispatch }));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'AUTHENTICATED' }),
      );
    });
    const action = dispatch.mock.calls.find(([a]) => a.type === 'AUTHENTICATED')?.[0];
    expect(action.session.status).toBe('authenticated');
    expect(action.session.profile.email).toBe('user@test.com');
  });

  it('dispatches LOGOUT when no Firebase user exists', async () => {
    const dispatch = vi.fn();
    const provider = makeProvider({ getCurrentUid: () => null });

    renderHook(() => useAuthInit({ provider, dispatch }));

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'LOGOUT' });
    });
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it('kicks off the session-cookie sync before profile hydration completes', async () => {
    const dispatch = vi.fn();
    const provider = makeProvider({});

    renderHook(() => useAuthInit({ provider, dispatch }));

    await waitFor(() => {
      expect(syncSessionCookieMock).toHaveBeenCalledWith('token-1');
    });
  });
});
