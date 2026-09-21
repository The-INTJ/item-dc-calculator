import type { ReactNode } from 'react';
import '@fontsource/fraunces/300.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

export const metadata = {
  title: 'Moriah Primitive Baptist Church — Design Preview',
  description:
    'A design preview of a refreshed moriahpbc.org: sermon search, church calendar, and news for Moriah Primitive Baptist Church in Colbert, Georgia.',
  robots: { index: false, follow: false },
};

export default function MoriahLayout({ children }: { children: ReactNode }) {
  return children;
}
