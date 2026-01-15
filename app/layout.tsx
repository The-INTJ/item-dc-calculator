import type { ReactNode } from 'react';
import './globals.scss';
import { NavBar } from './components/NavBar';

export const metadata = {
  title: 'Mixology Rating App | Shard DC Calculator',
  description: 'Mixology contest rating experience for judging and scoring cocktail matchups.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header__brand">Mixology Rating App</div>
          <NavBar />
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
