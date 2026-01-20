'use client';

/**
 * Login form component
 */

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login, loginAnonymously, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [anonymousLoading, setAnonymousLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login({ email, password });

    setLoading(false);
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error ?? 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    const result = await loginWithGoogle();

    setGoogleLoading(false);
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error ?? 'Google sign-in failed');
    }
  };

  const handleAnonymousLogin = async () => {
    setError(null);
    setAnonymousLoading(true);

    const result = await loginAnonymously();

    setAnonymousLoading(false);
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error ?? 'Anonymous sign-in failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Sign In</h2>

      {error && <div className="auth-error">{error}</div>}

      <div className="auth-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="button-primary" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <button
        type="button"
        className="button-secondary"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        {googleLoading ? 'Connecting...' : 'Continue with Google'}
      </button>

      <button
        type="button"
        className="button-secondary"
        onClick={handleAnonymousLogin}
        disabled={anonymousLoading}
      >
        {anonymousLoading ? 'Connecting...' : 'Continue anonymously'}
      </button>

      {onSwitchToRegister && (
        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onSwitchToRegister} className="auth-link">
            Create one
          </button>
        </p>
      )}
    </form>
  );
}
