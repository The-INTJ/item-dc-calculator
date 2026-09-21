import type { ReactNode } from 'react';

import { directoryPage, pageTitles, type PageKey } from '../content';
import styles from './MoriahDemo.module.scss';

/** Heading band for pages whose body is a bare component (the directory). */
export function PageHeading({ page, children }: { page: PageKey; children: ReactNode }) {
  return (
    <>
      <section className={`${styles.band} ${styles.newsHeadBand}`}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>{directoryPage.eyebrow}</span>
          <h1 className={styles.h1}>{pageTitles[page]}</h1>
          <p className={styles.lede}>{directoryPage.sub}</p>
          <p className={styles.notice}>{directoryPage.notice}</p>
        </div>
      </section>
      <section className={styles.band} aria-label="Households">
        <div className={styles.container}>{children}</div>
      </section>
    </>
  );
}
