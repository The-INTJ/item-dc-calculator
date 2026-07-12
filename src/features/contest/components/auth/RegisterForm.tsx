'use client';

/**
 * Registration form. In `register` mode it creates a brand-new email/password
 * account; in `upgrade` mode it links the credentials onto the CURRENT guest
 * session (same Firebase uid — votes and registrations carry over).
 */

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';

interface RegisterFormProps {
  mode?: 'register' | 'upgrade';
  initialDisplayName?: string;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  mode = 'register',
  initialDisplayName = '',
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const { register, upgradeGuestWithEmail } = useAuth();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isUpgrade = mode === 'upgrade';
  const heading = isUpgrade ? 'Make your account permanent' : 'Create Account';
  const submitLabel = isUpgrade ? 'Upgrade account' : 'Create Account';
  const busyLabel = isUpgrade ? 'Upgrading...' : 'Creating account...';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const action = isUpgrade ? upgradeGuestWithEmail : register;
    const result = await action({ email, password, displayName });

    setLoading(false);
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error ?? (isUpgrade ? 'Account upgrade failed' : 'Registration failed'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{heading}</h2>
      {isUpgrade && (
        <p className="guest-note">
          Your guest votes and registrations stay with you — this adds a sign-in to the same
          account.
        </p>
      )}

      {error && <div className="auth-error">{error}</div>}

      <div className="auth-field">
        <label htmlFor="register-name">Display Name</label>
        <input
          id="register-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="register-confirm">Confirm Password</label>
        <input
          id="register-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="button-primary" disabled={loading}>
        {loading ? busyLabel : submitLabel}
      </button>

      {onSwitchToLogin && (
        <p className="auth-switch">
          {isUpgrade ? 'Changed your mind?' : 'Already have an account?'}{' '}
          <button type="button" onClick={onSwitchToLogin} className="auth-link">
            {isUpgrade ? 'Keep browsing as a guest' : 'Back to sign in'}
          </button>
        </p>
      )}
    </form>
  );
}
