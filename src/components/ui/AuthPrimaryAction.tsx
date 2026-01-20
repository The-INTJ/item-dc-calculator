'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/mixology/contexts/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';

interface AuthPrimaryActionProps {
  signedOutLabel: string;
  signedOutHref: string;
  signedInLabel?: string;
  className?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  dataTestId?: string;
}

export function AuthPrimaryAction({
  signedOutLabel,
  signedOutHref,
  signedInLabel = 'Sign out',
  className,
  confirmTitle = 'Sign out',
  confirmMessage = 'Are you sure you want to sign out?',
  dataTestId,
}: AuthPrimaryActionProps) {
  const { isAuthenticated, loading, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) {
    return (
      <button type="button" className={className} disabled data-testid={dataTestId}>
        Loading...
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href={signedOutHref} className={className} data-testid={dataTestId}>
        {signedOutLabel}
      </Link>
    );
  }

  const handleConfirm = async () => {
    await logout();
    setConfirmOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setConfirmOpen(true)}
        data-testid={dataTestId}
      >
        {signedInLabel}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={signedInLabel}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
