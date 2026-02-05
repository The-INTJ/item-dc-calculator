export type NavItem = {
  key: string;
  label: string;
  href: string;
  variant?: 'secondary';
  requiresAdmin?: boolean;
};

export const navItems: NavItem[] = [
  {
    key: 'mixology-home',
    label: 'Mixology home',
    href: '/contest',
  },
  {
    key: 'mixology-current-round',
    label: 'Current Round',
    href: '/contest/vote',
  },
  {
    key: 'mixology-bracket',
    label: 'Bracket',
    href: '/contest/bracket',
  },
  {
    key: 'mixology-account',
    label: 'Account',
    href: '/contest/account',
    variant: 'secondary',
  },
  {
    key: 'mixology-admin',
    label: 'Admin',
    href: '/contest/admin',
    variant: 'secondary',
    requiresAdmin: true,
  },
];
