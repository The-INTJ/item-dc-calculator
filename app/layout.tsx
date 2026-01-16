import type { ReactNode } from 'react';
import './globals.scss';
import { RootLayoutClient } from './RootLayoutClient';

export const metadata = {
  title: 'Mixology Rating App | Shard DC Calculator',
  description: 'Mixology contest rating experience for judging and scoring cocktail matchups.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
