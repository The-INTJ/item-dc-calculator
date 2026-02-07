'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/features/contest/contexts/auth/AuthContext';
import { NavBar } from './NavBar';
import styles from '@/contest/styles/components/Header.module.scss';

export function SiteHeader() {
  const pathname = usePathname();
  const showContestHeader = !pathname.startsWith('/dc-calculator');
  if (!showContestHeader) {
    return null;
  }
  const { isAuthenticated, loading } = useAuth();
  const showAuthBanner =
    pathname.startsWith('/contest') && !loading && !isAuthenticated;


  return (
    <header className="site-header">
      <Link href="/" className={styles.homeLink}>
        Home
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
