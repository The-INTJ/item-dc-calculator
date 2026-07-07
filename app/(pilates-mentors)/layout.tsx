import type { ReactNode } from 'react';
import '@fontsource/fraunces/300.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

export const metadata = {
  title: 'Pilates Mentors — Design Preview',
  description:
    'A design preview of the redesigned Pilates Mentors homepage: mentorship and 500+ expert videos for Pilates instructors.',
  robots: { index: false, follow: false },
};

export default function PilatesMentorsLayout({ children }: { children: ReactNode }) {
  return children;
}
