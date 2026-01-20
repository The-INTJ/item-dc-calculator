'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/mixology/contexts/AuthContext';

interface AdminOnlyLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  dataTestId?: string;
}

export function AdminOnlyLink({ href, className, children, dataTestId }: AdminOnlyLinkProps) {
  const { role, loading } = useAuth();

  if (loading || role !== 'admin') {
    return null;
  }

  return (
    <Link href={href} className={className} data-testid={dataTestId}>
      {children}
    </Link>
  );
}
