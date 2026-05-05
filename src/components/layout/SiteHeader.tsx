'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { NavBar } from './NavBar';
import styles from '@/contest/styles/components/Header.module.scss';

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, isGuest, loading } = useAuth();

  const isDisplayMode = pathname.startsWith('/contest/') && pathname.endsWith('/display');
  if (isDisplayMode) {
    return null;
  }

  const showAuthBanner = pathname.startsWith('/contest') && !loading && !isAuthenticated && !isGuest;

  return (
    <header className="site-header">
      <Link href="/contests" className={styles.homeLink}>
        <span className="site-header__brand">
          <span className="site-header__logo" aria-hidden="true">C</span>
          <span className="site-header__title">Home</span>
        </span>
      </Link>
      <NavBar />
      {showAuthBanner ? (
        <div className="auth-banner" role="status" aria-live="polite">
          <div className="auth-banner__content">
            <span>Sign in to unlock this experience.</span>
            <Button href="/onboard" variant="secondary" className="auth-banner__action">
              Log in
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
