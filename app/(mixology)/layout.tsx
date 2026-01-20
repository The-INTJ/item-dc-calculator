import type { ReactNode } from 'react';

export const metadata = {
  title: 'Mixology Rating App',
  description: 'Mixology contest rating experience for judging and scoring cocktail matchups.',
};

export default function MixologyGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
