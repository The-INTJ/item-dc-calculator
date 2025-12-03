import Link from 'next/link';

export type AppExperience = 'home' | 'mixology' | 'calculator';

type NavBarProps = {
  currentApp: AppExperience;
};

const navItems = [
  { key: 'mixology', label: 'Mixology experience', href: '/mixology' },
  { key: 'calculator', label: 'Item DC calculator', href: '/legacy', variant: 'secondary' },
] as const;

const brandText: Record<AppExperience, string> = {
  home: 'Item DC Apps',
  mixology: 'Mixology Rating App',
  calculator: 'Item DC Calculator',
};

export function NavBar({ currentApp }: NavBarProps) {
  return (
    <header className="site-header">
      <div className="site-header__brand">{brandText[currentApp]}</div>
      <nav className="site-nav" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = currentApp === item.key;
          const className = [
            'site-nav__link',
            item.variant === 'secondary' ? 'site-nav__link--secondary' : '',
            isActive ? 'site-nav__link--active' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <Link key={item.key} href={item.href} className={className} aria-current={isActive ? 'page' : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
