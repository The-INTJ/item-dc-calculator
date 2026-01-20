'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/mixology/auth';
import { useContestState, contestStateLabels } from '@/src/mixology/state';
import { navItems } from './navItems';

function isActiveLink(pathname: string, href: string) {
  if (href === '/mixology') {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function NavBar() {
  const pathname = usePathname();
  const { role, loading } = useAuth();
  const isAdmin = role === 'admin';
  const { state, label } = useContestState();

  return (
    <nav className="site-nav">
      {navItems.map((item) => {
        if (item.requiresAdmin && (loading || !isAdmin)) {
          return null;
        }
        const isActive = isActiveLink(pathname, item.href);
        const className = [
          'site-nav__link',
          item.variant === 'secondary' ? 'site-nav__link--secondary' : '',
          isActive ? 'site-nav__link--active' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Link key={item.key} href={item.href} className={className}>
            {item.label}
          </Link>
        );
      })}
      <div className="site-nav__status" aria-live="polite">
        <span className={`site-nav__phase site-nav__phase--${state}`}>{label}</span>
      </div>
    </nav>
  );
}
