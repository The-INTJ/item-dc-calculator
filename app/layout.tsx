import type { ReactNode } from 'react';
import './globals.scss';

export const metadata = {
  title: 'Mixology Rating App | Item DC Calculator',
  description: 'Mixology contest rating experience alongside the original Item DC calculator.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
