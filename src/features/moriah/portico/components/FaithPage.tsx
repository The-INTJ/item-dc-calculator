import { beliefs } from '../../content';
import styles from './FaithPage.module.scss';

/** Panel numbers only — the site does not number its articles; these just order the door. */
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];

/**
 * The thirteen Articles of Faith, verbatim, set as the raised panels of a
 * great double door on the church's brick: the first — one true and living
 * God — in the transom over both leaves, the other twelve six to a leaf, read
 * left to right, top to bottom. The page's heading sits in the gable above.
 */
export function FaithPage() {
  return (
    <div className={styles.wall}>
      <div className={styles.casing}>
        <ol className={styles.door}>
          {beliefs.articles.map((article, index) => (
            <li
              key={article.refs}
              className={`${styles.panel} ${index === 0 ? styles.transom : ''}`}
            >
              <span className={styles.numeral} aria-hidden="true">
                {NUMERALS[index]}
              </span>
              <p className={styles.article}>{article.text}</p>
              <p className={styles.refs}>{article.refs}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
