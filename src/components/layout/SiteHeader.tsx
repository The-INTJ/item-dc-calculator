'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/features/contest/contexts/auth/AuthContext';
import { useCurrentContest } from '@/contest/lib/hooks/useCurrentContest';
import { NavBar } from './NavBar';
import styles from '@/contest/styles/components/Header.module.scss';

const authRequiredPrefixes = [
  '/contest/admin',
  '/contest/vote',
  '/contest/bracket',
  '/contest/account',
];

function needsAuthBanner(pathname: string) {
  return authRequiredPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const { data: contest } = useCurrentContest();

  const showHeader = pathname === '/' || pathname.startsWith('/contest');

  if (!showHeader) {
    return null;
  }

  const showAuthBanner =
    pathname.startsWith('/contest') && !loading && !isAuthenticated && needsAuthBanner(pathname);

  return (
    <header className="site-header">
      <Link href="/" className={styles.homeLink}>
        {contest?.name ?? 'Home'}
      </Link>
      <NavBar />
      {showAuthBanner ? (
        <div className="auth-banner" role="status" aria-live="polite">
          <div className="auth-banner__content">
            <span>Sign in to unlock this experience.</span>
            <Link href="/contest/onboard" className="button-secondary auth-banner__action">
              Log in
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
