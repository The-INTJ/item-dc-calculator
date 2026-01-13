import type { ReactNode } from 'react';
import './globals.scss';
import { NavBar } from './components/NavBar';
import { ThemeBodyClass } from './components/ThemeBodyClass';

export const metadata = {
  title: 'Mixology Rating App | Shard DC Calculator',
  description: 'Mixology contest rating experience alongside the legacy Shard DC calculator.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="theme-mixology">
        <ThemeBodyClass />
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header__brand">Mixology Rating App</div>
            <NavBar />
          </header>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
