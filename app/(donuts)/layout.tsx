import type { ReactNode } from 'react';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

/**
 * Fraunces for display type and Inter for controls — the meetinghouse look is
 * letterpress serif on aged paper, with plain sans for anything you tap.
 */
export default function DonutsLayout({ children }: { children: ReactNode }) {
  return children;
}
