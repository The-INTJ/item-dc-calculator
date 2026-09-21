import Image from 'next/image';

import { hero, services, urls } from '../content';
import styles from './MoriahDemo.module.scss';

export function MoriahHero() {
  return (
    <section className={styles.hero} aria-labelledby="mo-hero-heading">
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
          <h1 id="mo-hero-heading" className={styles.h1}>
            {hero.headline}
          </h1>
          <p className={styles.lede}>{hero.sub}</p>
          <p className={styles.heroAttribution}>{hero.attribution}</p>
          <div className={styles.heroCtas}>
            <a href={urls.maps} className={styles.buttonPrimary}>
              {hero.primaryCta}
            </a>
            <a href="#sermons" className={styles.buttonGhost}>
              {hero.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Service times, pulled up directly under the hero — the one thing a first-time visitor came for. */
export function MoriahTimes() {
  return (
    <section className={styles.timesStrip} aria-label="Service times">
      <div className={styles.container}>
        <div className={styles.timesInner}>
          {services.times.map((slot) => (
            <div key={slot.name} className={styles.timeItem}>
              <span className={styles.timeDay}>{slot.day}</span>
              <p className={styles.timeName}>{slot.name}</p>
              <span className={styles.timeValue}>{slot.time}</span>
            </div>
          ))}
        </div>
        <p className={styles.timesNote}>{services.note}</p>
      </div>
    </section>
  );
}
