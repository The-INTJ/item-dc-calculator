import type { ReactNode } from 'react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/cardo/400.css';
import '@fontsource/cardo/700.css';
import '@fontsource-variable/material-symbols-rounded/wght.css';

export const metadata = {
  title: 'Heritage Hymns',
  description: 'A search and browse demo for a curated hymnal collection.',
};

export default function HeritageHymnsLayout({ children }: { children: ReactNode }) {
  return children;
}
