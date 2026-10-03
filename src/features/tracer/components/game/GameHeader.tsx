import Link from 'next/link';
import type { ReactNode } from 'react';

import { BackToExperiments } from '@/components/ui/BackToExperiments';

import styles from './Game.module.scss';

/** Back to the portal, the wordmark (back to the lobby), and a menu. */
export function GameHeader({ menu }: { menu: ReactNode }) {
  return (
    <header className={styles.header}>
      <BackToExperiments className={styles.backLink} />
      <Link href="/tracer" className={styles.wordmark}>
        Tracer
      </Link>
      {menu}
    </header>
  );
}
