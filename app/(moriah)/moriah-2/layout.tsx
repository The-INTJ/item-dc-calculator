import type { ReactNode } from 'react';
import '@fontsource/libre-caslon-text/400.css';
import '@fontsource/libre-caslon-text/400-italic.css';
import '@fontsource/libre-caslon-text/700.css';
import '@fontsource/libre-caslon-display/400.css';

/** The Portico preview sets in Caslon; v1's Fraunces/Inter still load from the group layout. */
export default function PorticoLayout({ children }: { children: ReactNode }) {
  return children;
}
