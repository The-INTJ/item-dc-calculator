import { urls } from '../../content';
import { siteLabels } from '../content';
import styles from './HistoryPlaque.module.scss';
import { Lantern } from './Lantern';

/** "200 Years of Blessing" → its figure and its words, for the tablet's two lines. */
const [FIGURE, ...WORDS] = siteLabels.history.split(' ');

/**
 * The bicentennial book — the one button on the live site's home page — as a
 * dedication tablet set in the brick between two lanterns.
 */
export function HistoryPlaque() {
  return (
    <div className={styles.wall}>
      <span className={styles.lamp} aria-hidden="true">
        <Lantern idPrefix="plaque-left" className={styles.lantern} />
      </span>
      <a href={urls.history} className={styles.plaque}>
        <span className={styles.figure}>{FIGURE}</span>{' '}
        <span className={styles.words}>{WORDS.join(' ')}</span>
      </a>
      <span className={styles.lamp} aria-hidden="true">
        <Lantern idPrefix="plaque-right" className={styles.lantern} />
      </span>
    </div>
  );
}
