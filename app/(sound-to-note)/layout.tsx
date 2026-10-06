import type { ReactNode } from 'react';

export const metadata = {
  title: 'Alex Ferré — Production Audio Mixer',
  description:
    'Alex Ferré (Sound To Note), production audio mixer in Atlanta, GA: credits, gear, and booking.',
  icons: { icon: '/sound-to-note/icon.png' },
  robots: { index: false, follow: false },
};

/** Fonts load in the feature (next/font), scoped to the site wrapper. */
export default function SoundToNoteLayout({ children }: { children: ReactNode }) {
  return children;
}
