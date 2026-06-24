import { hymnCatalog } from '../lib/catalog';
import type { HymnSearchResult } from '../lib/types';
import { getHeritageTabHref } from '../lib/tabs';
import { HymnCard } from './HymnCard';
import styles from './HeritageHymnsDemo.module.scss';

const sampleNumbers = [23, 16, 227];

const sampleResults: HymnSearchResult[] = sampleNumbers
  .map((number) => hymnCatalog.find((entry) => entry.number === number))
  .filter((entry): entry is NonNullable<typeof entry> => entry != null)
  .map((entry) => ({ entry, matches: [] }));

export function HomeTab() {
  return (
    <div className={styles.homePage}>
      <section className={styles.homeHero} aria-labelledby="home-title">
        <div className={styles.homeImageWell} aria-hidden="true" />
        <div className={styles.homeTitleBlock}>
          <p>Heritage Hymns</p>
          <h1 id="home-title">Heritage Hymns</h1>
          <strong>Treasures New & Old</strong>
          <span className={styles.homeFleuron} aria-hidden="true" />
        </div>
        <div className={styles.homeInvitation}>
          <p>A hymnal for congregational song, family worship, and personal devotion.</p>
          <a href={getHeritageTabHref('hymns')}>Explore the Hymns</a>
        </div>
      </section>

      <section className={styles.homeCollection} aria-labelledby="collection-preview-title">
        <header className={styles.homeSectionHeader}>
          <h2 id="collection-preview-title">From the Collection</h2>
          <a href={getHeritageTabHref('hymns')}>Explore the Full Collection</a>
        </header>
        <div className={styles.homeCollectionList}>
          {sampleResults.map((result) => (
            <HymnCard key={result.entry.id} result={result} />
          ))}
        </div>
      </section>

      <section className={styles.homeClosing} aria-labelledby="home-closing-title">
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
