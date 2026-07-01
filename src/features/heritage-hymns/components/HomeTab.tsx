import Image from 'next/image';
import { getHeritageTabHref } from '../lib/tabs';
import styles from './HeritageHymnsDemo.module.scss';

export function HomeTab() {
  return (
    <div className={styles.homePage}>
      <section className={styles.homeHero} aria-labelledby="home-title">
        <Image
          src="/heritage-hymns/images/singing-in-the-pews.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.homeHeroImage}
        />
        <div className={styles.homeImageWell} aria-hidden="true" />
        <div className={styles.homeTitleBlock}>
          <h1 id="home-title">HERITAGE HYMNS</h1>
          <strong>Treasures New & Old</strong>
          <span className={styles.homeFleuron} aria-hidden="true" />
        </div>
        <div className={styles.homeInvitation}>
          <p>A hymnal for congregational song, family worship, and personal devotion.</p>
          <a href={getHeritageTabHref('hymns')}>Explore the Hymns</a>
        </div>
      </section>

      <section className={styles.homeClosing} aria-labelledby="home-closing-title">
        <Image
          src="/heritage-hymns/images/cades-cove-church.jpg"
          alt=""
          fill
          sizes="100vw"
          className={styles.homeClosingImage}
        />
        <div className={styles.homeImageWell} aria-hidden="true" />
        <div className={styles.homeClosingContent}>
          <h2 id="home-closing-title">
            Hymns rooted in biblical truth for the exaltation of God and the edification of His people.
          </h2>
          <span className={styles.homeDivider} aria-hidden="true" />
          <blockquote>
            <p>
              Every scribe which is instructed unto the kingdom of heaven is like unto a man that is an
              householder, which bringeth forth out of his treasure things new and old.
            </p>
            <cite>Matthew 13:52</cite>
          </blockquote>
        </div>
      </section>
    </div>
  );
}
