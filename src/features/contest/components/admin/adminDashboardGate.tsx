'use client';

import { Button } from '@/components/ui';
import type { UserRole } from '../../contexts/contest/contestTypes';

export type AdminGateState =
  | { kind: 'loading'; message: string }
  | { kind: 'error'; message: string; action: { href: string; label: string } | { retry: true } };

interface GateInputs {
  authLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

/**
 * What stands between an admin and the dashboard, in the order it matters:
 * knowing who they are, then whether they may be here, then having data.
 * Null means nothing is in the way.
 */
export function resolveAdminGate({
  authLoading,
  isAuthenticated,
  role,
  loading,
  error,
}: GateInputs): AdminGateState | null {
  if (authLoading) {
    return { kind: 'loading', message: 'Checking admin access...' };
  }
  if (!isAuthenticated) {
    return {
      kind: 'error',
      message: 'Sign in to access the admin dashboard.',
      action: { href: '/onboard', label: 'Log in' },
    };
  }
  if (role !== 'admin') {
    return {
      kind: 'error',
      message: 'Admin access required.',
      action: { href: '/contests', label: 'Return to contests' },
    };
  }
  if (loading) {
    return { kind: 'loading', message: 'Loading contests...' };
  }
  if (error) {
    return {
      kind: 'error',
      message: `Error loading contests: ${error}`,
      action: { retry: true },
    };
  }
  return null;
}

export function AdminGateNotice({
  state,
  onRetry,
}: {
  state: AdminGateState;
  onRetry: () => void;
}) {
  if (state.kind === 'loading') {
    return <div className="admin-loading">{state.message}</div>;
  }

  return (
    <div className="admin-error">
      <p>{state.message}</p>
      {'retry' in state.action ? (
        <Button onClick={onRetry} variant="secondary">
          Retry
        </Button>
      ) : (
        <Button href={state.action.href} variant="secondary">
          {state.action.label}
        </Button>
      )}
    </div>
  );
}
