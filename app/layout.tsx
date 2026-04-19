import type { ReactNode } from 'react';
import './globals.scss';

export const metadata = {
  title: 'Experiments | Drew Taylor',
  description: 'A portal for the experiences hosted on this site.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
