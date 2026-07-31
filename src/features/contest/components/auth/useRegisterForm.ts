'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/auth/AuthContext';

type RegisterFields = {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

interface RegisterFormArgs {
  mode: 'register' | 'upgrade';
  initialDisplayName: string;
  onSuccess?: () => void;
}

/**
 * Registration state and the rules for submitting it. `upgrade` mode links the
 * credentials onto the current guest session instead of creating a new
 * account, which changes the action, the copy, and the failure message — but
 * nothing else about the form.
 */
export function useRegisterForm({ mode, initialDisplayName, onSuccess }: RegisterFormArgs) {
  const { register, upgradeGuestWithEmail } = useAuth();
  const [fields, setFields] = useState<RegisterFields>({
    displayName: initialDisplayName,
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isUpgrade = mode === 'upgrade';

  function setField(name: keyof RegisterFields, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const { displayName, email, password, confirmPassword } = fields;
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

  return {
    fields,
    setField,
    error,
    loading,
    isUpgrade,
    handleSubmit,
    heading: isUpgrade ? 'Make your account permanent' : 'Create Account',
    submitLabel: isUpgrade ? 'Upgrade account' : 'Create Account',
    busyLabel: isUpgrade ? 'Upgrading...' : 'Creating account...',
  };
}
