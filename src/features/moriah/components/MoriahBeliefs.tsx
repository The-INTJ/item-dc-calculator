import { beliefs, history, urls } from '../content';
import styles from './MoriahDemo.module.scss';

export function MoriahBeliefs() {
  return (
    <section id="beliefs" className={styles.band} aria-labelledby="mo-beliefs-heading">
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>{beliefs.eyebrow}</span>
          <h2 id="mo-beliefs-heading" className={styles.h2}>
            {beliefs.headline}
          </h2>
        </div>
        <ol className={styles.beliefGrid}>
          {beliefs.articles.map((article) => (
            <li key={article.refs} className={styles.beliefItem}>
              <p className={styles.beliefText}>{article.text}</p>
              <span className={styles.beliefRefs}>{article.refs}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function MoriahHistory() {
  return (
    <section className={`${styles.band} ${styles.bandStone}`} aria-labelledby="mo-history-heading">
      <div className={`${styles.container} ${styles.historyInner}`}>
        <div>
          <span className={styles.eyebrow}>{history.eyebrow}</span>
          <h2 id="mo-history-heading" className={styles.h2}>
            {history.headline}
          </h2>
        </div>
        <a href={urls.history} className={styles.buttonPrimary}>
          {history.cta}
        </a>
      </div>
    </section>
  );
}
