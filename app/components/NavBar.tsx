'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  key: 'mixology';
  label: string;
  href: string;
  variant?: 'secondary';
};

const navItems: NavItem[] = [
  {
    key: 'mixology',
    label: 'Mixology experience',
    href: '/mixology',
  },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
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
