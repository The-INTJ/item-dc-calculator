import Image from 'next/image';

import { finalCta, gap, method, pmUrls } from '../content';
import { PilatesMentorsFooter, PilatesMentorsHeader } from './PilatesMentorsChrome';
import styles from './PilatesMentorsDemo.module.scss';
import { PilatesMentorsHero } from './PilatesMentorsHero';
import { PilatesMentorsHubs } from './PilatesMentorsHubs';
import { PilatesMentorsMentors } from './PilatesMentorsMentors';
import { PilatesMentorsPricing } from './PilatesMentorsPricing';
import { PilatesMentorsStories } from './PilatesMentorsStories';

/**
 * Static design preview of the redesigned pilatesmentors.com homepage.
 * Server component, zero client JS — every interactive destination links to
 * the real live site so reviewers can click through.
 */
export function PilatesMentorsDemo() {
  return (
    <div className={styles.page}>
      <PilatesMentorsHeader />

      <main>
        <PilatesMentorsHero />

        <section className={`${styles.band} ${styles.gapBand}`} aria-labelledby="pm-gap-heading">
          <div className={`${styles.container} ${styles.splitGrid}`}>
            <Image
              src={gap.image.src}
              alt={gap.image.alt}
              width={1600}
              height={2405}
              sizes="(max-width: 900px) 100vw, 40vw"
              className={styles.splitImage}
            />
            <div>
              <span className={styles.eyebrow}>{gap.eyebrow}</span>
              <h2 id="pm-gap-heading" className={styles.h2}>
                {gap.headline}
              </h2>
              <p className={styles.lede}>{gap.body}</p>
            </div>
          </div>
        </section>

        <section id="method" className={styles.band} aria-labelledby="pm-method-heading">
          <div className={styles.container}>
            <span className={styles.eyebrow}>{method.eyebrow}</span>
            <h2 id="pm-method-heading" className={styles.h2}>
              {method.headline}
            </h2>
            <div className={styles.pillarGrid}>
              {method.pillars.map((pillar) => (
                <article key={pillar.title} className={styles.pillarCard}>
                  <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                  <p className={styles.pillarBody}>{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <PilatesMentorsMentors />

        <PilatesMentorsHubs />

        <PilatesMentorsStories />

        <PilatesMentorsPricing />

        <section className={`${styles.band} ${styles.finalBand}`} aria-labelledby="pm-final-heading">
          <div className={styles.container}>
            <h2 id="pm-final-heading" className={styles.h2}>
              {finalCta.headline}
            </h2>
            <div className={styles.finalCtas}>
              <a href={pmUrls.pricing} className={styles.buttonPrimary}>
                {finalCta.cta}
              </a>
              <a href={pmUrls.onDemand} className={styles.textLink}>
                {finalCta.secondary}
              </a>
            </div>
          </div>
        </section>
      </main>

      <PilatesMentorsFooter />
    </div>
  );
}
