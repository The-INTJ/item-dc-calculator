import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/fraunces/600.css';

import { TracerRoot } from '@/features/tracer';

export const metadata: Metadata = {
  title: { default: 'Tracer', template: '%s · Tracer' },
  description: 'Chess where pieces learn their moves from the paths you draw. Send a link, play a friend.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#121417' },
  ],
};

/** One auth session for the lobby and every game, so a guest stays signed in. */
export default function TracerLayout({ children }: { children: ReactNode }) {
  return <TracerRoot>{children}</TracerRoot>;
}
