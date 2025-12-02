import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.scss';

export const metadata = {
  title: 'Mixology Rating App | Shard DC Calculator',
  description: 'Mixology contest rating experience alongside the legacy Shard DC calculator.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header__brand">Mixology Rating App</div>
          <nav className="site-nav">
            <Link href="/mixology" className="site-nav__link">
              Mixology experience
            </Link>
            <Link href="/legacy" className="site-nav__link site-nav__link--secondary">
              Legacy item DC calculator
            </Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
