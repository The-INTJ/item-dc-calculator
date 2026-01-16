'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  key: string;
  label: string;
  href: string;
  variant?: 'secondary';
};

const navItems: NavItem[] = [
  {
    key: 'mixology-home',
    label: 'Mixology home',
    href: '/mixology',
  },
  {
    key: 'mixology-current-round',
    label: 'Current Round',
    href: '/mixology/vote',
  },
  {
    key: 'mixology-bracket',
    label: 'Bracket',
    href: '/mixology/bracket',
  },
  {
    key: 'mixology-account',
    label: 'Account',
    href: '/mixology/account',
    variant: 'secondary',
  },
  {
    key: 'mixology-admin',
    label: 'Admin',
    href: '/mixology/admin',
    variant: 'secondary',
  },
];

function isActiveLink(pathname: string, href: string) {
  if (href === '/mixology') {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      {navItems.map((item) => {
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
