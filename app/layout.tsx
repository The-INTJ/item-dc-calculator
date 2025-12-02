import type { ReactNode } from 'react';
import './globals.scss';

export const metadata = {
  title: 'Shard DC Calculator',
  description: 'Calculate item DC values and shard odds.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
