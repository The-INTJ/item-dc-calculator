export type NavItem = {
  key: string;
  label: string;
  href: string;
  variant?: 'secondary';
  requiresAdmin?: boolean;
};

export const navItems: NavItem[] = [
  {
    key: 'contest-home',
    label: 'Contest home',
    href: '/contest',
  },
  {
    key: 'contest-current-round',
    label: 'Current Round',
    href: '/contest/vote',
  },
  {
    key: 'contest-bracket',
    label: 'Bracket',
    href: '/contest/bracket',
  },
  {
    key: 'contest-account',
    label: 'Account',
    href: '/contest/account',
    variant: 'secondary',
  },
  {
    key: 'contest-admin',
    label: 'Admin',
    href: '/contest/admin',
    variant: 'secondary',
    requiresAdmin: true,
  },
];
