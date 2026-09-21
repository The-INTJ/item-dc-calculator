import Link from 'next/link';

import { directoryPage, routes } from '../content';
import { DirectoryCards } from './DirectoryCards';
import { MoriahFooter, MoriahHeader } from './MoriahChrome';
import styles from './MoriahDemo.module.scss';

export function MoriahDirectory() {
  return (
    <div className={styles.page}>
      <MoriahHeader />
      <main>
        <section className={`${styles.band} ${styles.newsHeadBand}`}>
          <div className={styles.container}>
            <span className={styles.eyebrow}>{directoryPage.eyebrow}</span>
            <h1 className={styles.h1}>{directoryPage.headline}</h1>
            <p className={styles.lede}>{directoryPage.sub}</p>
            <p className={styles.notice}>{directoryPage.notice}</p>
          </div>
        </section>

        <section className={styles.band} aria-label="Households">
          <div className={styles.container}>
            <DirectoryCards />
            <p className={styles.bandFoot}>
              <Link href={routes.home} className={styles.buttonGhost}>
                {directoryPage.backCta}
              </Link>
            </p>
          </div>
        </section>
      </main>
      <MoriahFooter />
    </div>
  );
}
