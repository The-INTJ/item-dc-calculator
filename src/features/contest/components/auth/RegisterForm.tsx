'use client';

/**
 * Registration form. In `register` mode it creates a brand-new email/password
 * account; in `upgrade` mode it links the credentials onto the CURRENT guest
 * session (same Firebase uid — votes and registrations carry over).
 */

import { AuthField } from './AuthField';
import { useRegisterForm } from './useRegisterForm';

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
  const {
    fields,
    setField,
    error,
    loading,
    isUpgrade,
    handleSubmit,
    heading,
    submitLabel,
    busyLabel,
  } = useRegisterForm({ mode, initialDisplayName, onSuccess });

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

      <AuthField
        id="register-name"
        label="Display Name"
        type="text"
        value={fields.displayName}
        onChange={(value) => setField('displayName', value)}
        autoComplete="name"
      />
      <AuthField
        id="register-email"
        label="Email"
        type="email"
        value={fields.email}
        onChange={(value) => setField('email', value)}
        autoComplete="email"
      />
      <AuthField
        id="register-password"
        label="Password"
        type="password"
        value={fields.password}
        onChange={(value) => setField('password', value)}
        autoComplete="new-password"
        minLength={6}
      />
      <AuthField
        id="register-confirm"
        label="Confirm Password"
        type="password"
        value={fields.confirmPassword}
        onChange={(value) => setField('confirmPassword', value)}
        autoComplete="new-password"
      />

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
