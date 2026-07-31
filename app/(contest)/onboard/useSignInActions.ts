'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contest/contexts/auth/AuthContext';

export type SignInBusyAction = 'anonymous' | 'google' | 'email' | null;

/**
 * State and handlers for the signed-out welcome view's three sign-in paths:
 * guest continue, email/password, and Google. Lives at the SignedOutOnboarding
 * level so drafts and errors survive switching to the register view and back.
 */
export function useSignInActions() {
  const router = useRouter();
  const { startGuestSession, loginWithGoogle, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<SignInBusyAction>(null);
  const [guestName, setGuestName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleGuestContinue = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = guestName.trim();

    if (!trimmedName) {
      setError('Display name is required to continue as guest.');
      return;
    }

    setBusyAction('anonymous');
    const result = await startGuestSession(trimmedName);
    setBusyAction(null);

    if (!result.success) {
      setError(result.error ?? 'Anonymous sign-in failed');
      return;
    }

    router.push('/contests');
  };

  const handleGoogle = async () => {
    setError(null);
    setBusyAction('google');
    const result = await loginWithGoogle();
    setBusyAction(null);
    if (result.success) {
      router.push('/contests');
    } else {
      setError(result.error ?? 'Google sign-in failed');
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setError('Email and password are required.');
      return;
    }
    setBusyAction('email');
    const result = await login({ email: loginEmail.trim(), password: loginPassword });
    setBusyAction(null);
    if (result.success) {
      router.push('/contests');
    } else {
      setError(result.error ?? 'Sign in failed');
    }
  };

  return {
    error,
    busyAction,
    guestName,
    setGuestName,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    handleGuestContinue,
    handleGoogle,
    handleEmailLogin,
  };
}
