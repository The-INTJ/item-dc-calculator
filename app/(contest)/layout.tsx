import type { ReactNode } from 'react';
import '@fontsource-variable/material-symbols-rounded/wght.css';
import './contest.scss';
import { ContestShell } from './ContestShell';

export const metadata = {
  title: 'Contest App',
  description: 'Contest judging, scoring, and display mode.',
};

export default function ContestLayout({ children }: { children: ReactNode }) {
  return <ContestShell>{children}</ContestShell>;
}
