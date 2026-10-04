import Link from 'next/link';
import type { ReactNode } from 'react';

import { BackToExperiments } from '@/components/ui/BackToExperiments';

import styles from './Game.module.scss';

/** Back to the portal, the wordmark (back to the lobby), and a menu — with the game's style beneath. */
export function GameHeader({ menu, chip = null }: { menu: ReactNode; chip?: ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <BackToExperiments className={styles.backLink} />
        <Link href="/tracer" className={styles.wordmark}>
          Tracer
        </Link>
        {menu}
      </header>
      {chip && <div className={styles.styleRow}>{chip}</div>}
    </>
  );
}
