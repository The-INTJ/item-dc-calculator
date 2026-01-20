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
    requiresAdmin: true,
  },
];
