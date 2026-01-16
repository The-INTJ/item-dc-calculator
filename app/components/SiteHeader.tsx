'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/mixology/auth';
import { NavBar } from './NavBar';

const authRequiredPrefixes = [
  '/mixology/admin',
  '/mixology/vote',
  '/mixology/bracket',
  '/mixology/account',
];

function needsAuthBanner(pathname: string) {
  return authRequiredPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const showHeader = pathname === '/' || pathname.startsWith('/mixology');

  if (!showHeader) {
    return null;
  }

  const showAuthBanner =
    pathname.startsWith('/mixology') && !loading && !isAuthenticated && needsAuthBanner(pathname);

  return (
    <header className="site-header">
      <div className="site-header__brand">Mixology Rating App</div>
      <NavBar />
      {showAuthBanner ? (
        <div className="auth-banner" role="status" aria-live="polite">
          <div className="auth-banner__content">
            <span>Sign in to unlock this experience.</span>
            <Link href="/mixology/onboard" className="button-secondary auth-banner__action">
              Log in
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
