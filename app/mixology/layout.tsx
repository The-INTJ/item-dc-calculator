import type { ReactNode } from 'react';
import { MixologyLayoutClient } from './MixologyLayoutClient';

export default function MixologyLayout({ children }: { children: ReactNode }) {
  return <MixologyLayoutClient>{children}</MixologyLayoutClient>;
}
