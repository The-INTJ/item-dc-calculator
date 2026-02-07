export type NavItem = {
  key: string;
  label: string;
  href: string;
  variant?: 'secondary';
  requiresAdmin?: boolean;
};

export const navItems: NavItem[] = [
  {
    key: 'contest-current-round',
    label: 'Current Round',
    href: '/vote',
  },
  {
    key: 'contest-bracket',
    label: 'Bracket',
    href: '/bracket',
  },
  {
    key: 'contest-account',
    label: 'Account',
    href: '/account',
    variant: 'secondary',
  },
  {
    key: 'contest-admin',
    label: 'Admin',
    href: '/admin',
    variant: 'secondary',
    requiresAdmin: true,
  },
];
