import type { ReactNode } from 'react';
import './globals.scss';
import { RootLayoutClient } from './RootLayoutClient';

export const metadata = {
  title: 'Contest App | Item DC Calculator',
  description: 'Contest judging, scoring, and display mode alongside the legacy item DC calculator.',
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
