'use client';

import { useState, type FormEvent } from 'react';

import { useAuth } from '@/contest/contexts/auth/AuthContext';

import styles from './PlantAccessBoundary.module.scss';

/**
 * Sign-in for the private tracker. Password and Google track separate busy
 * flags so one in flight doesn't disable the other's button.
 */
export function PlantSignInForm() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPasswordBusy(true);
    const result = await login({ email: email.trim(), password });
    setPasswordBusy(false);
    if (!result.success) {
      setError(result.error ?? 'Sign-in failed.');
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleBusy(true);
    const result = await loginWithGoogle();
    setGoogleBusy(false);
    if (!result.success) {
      setError(result.error ?? 'Google sign-in failed.');
    }
  }

  return (
    <>
      <h1 className={styles.title}>Plant tracker</h1>
      <p className={styles.message}>Sign in with an approved Firebase account to continue.</p>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handlePasswordLogin}>
        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className={styles.primaryButton} disabled={passwordBusy}>
          {passwordBusy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <button
        type="button"
        className={styles.secondaryButton}
        onClick={handleGoogleLogin}
        disabled={googleBusy}
      >
        {googleBusy ? 'Connecting…' : 'Continue with Google'}
      </button>
    </>
  );
}
