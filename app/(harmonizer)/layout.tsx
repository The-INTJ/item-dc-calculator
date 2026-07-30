import type { ReactNode } from 'react';
import '@fontsource-variable/material-symbols-rounded/wght.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';

export const metadata = {
  title: 'Hymn Harmonization Workbench',
  description:
    'A proof-of-concept workbench for auditioning four-part hymn harmonizations of a melody fragment.',
  robots: { index: false, follow: false },
};

export default function HarmonizerLayout({ children }: { children: ReactNode }) {
  return children;
}
