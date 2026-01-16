'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/mixology/auth';
import { ConfirmDialog } from './ConfirmDialog';

interface AuthPrimaryActionProps {
  signedOutLabel: string;
  signedOutHref: string;
  signedInLabel?: string;
  className?: string;
  confirmTitle?: string;
  confirmMessage?: string;
}

export function AuthPrimaryAction({
  signedOutLabel,
  signedOutHref,
  signedInLabel = 'Sign out',
  className,
  confirmTitle = 'Sign out',
  confirmMessage = 'Are you sure you want to sign out?',
}: AuthPrimaryActionProps) {
  const { isAuthenticated, loading, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) {
    return (
      <button type="button" className={className} disabled>
        Loading...
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href={signedOutHref} className={className}>
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
      <button type="button" className={className} onClick={() => setConfirmOpen(true)}>
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
