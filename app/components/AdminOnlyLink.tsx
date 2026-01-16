'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/mixology/auth';

interface AdminOnlyLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function AdminOnlyLink({ href, className, children }: AdminOnlyLinkProps) {
  const { role, loading } = useAuth();

  if (loading || role !== 'admin') {
    return null;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
