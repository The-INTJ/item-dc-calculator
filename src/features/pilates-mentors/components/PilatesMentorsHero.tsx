import Image from 'next/image';

import { hero, pmUrls } from '../content';
import styles from './PilatesMentorsDemo.module.scss';

export function PilatesMentorsHero() {
  return (
    <section className={styles.hero} aria-labelledby="pm-hero-heading">
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        priority
        sizes="100vw"
        className={styles.heroBg}
      />
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={`${styles.container} ${styles.heroContent}`}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>{hero.eyebrow}</span>
          <h1 id="pm-hero-heading" className={styles.h1}>
            {hero.headline}
          </h1>
          <p className={styles.lede}>{hero.sub}</p>
          <div className={styles.heroCtas}>
            <a href={pmUrls.pricing} className={styles.buttonPrimary}>
              {hero.primaryCta}
            </a>
            <a href={pmUrls.onDemand} className={styles.textLink}>
              {hero.secondaryCta}
            </a>
          </div>
          <p className={styles.heroTrust}>{hero.trustLine}</p>
        </div>
      </div>
    </section>
  );
}
