'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/mixology/auth';
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
    </nav>
  );
}
