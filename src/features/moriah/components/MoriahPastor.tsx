import { pastor } from '../content';
import styles from './MoriahDemo.module.scss';

export function MoriahPastor() {
  return (
    <section id="pastor" className={`${styles.band} ${styles.pastorBand}`} aria-labelledby="mo-pastor-heading">
      <div className={styles.container}>
        <span className={styles.eyebrow}>{pastor.eyebrow}</span>
        <h2 id="mo-pastor-heading" className={styles.pastorName}>
          {pastor.name}
        </h2>
        <span className={styles.pastorSpouse}>{pastor.spouse}</span>
        <p className={styles.pastorLede}>{pastor.opening}</p>

        <div className={styles.pastorColumns}>
          {pastor.columns.map((column) => (
            <div key={column.title}>
              <h3 className={styles.pastorColTitle}>{column.title}</h3>
              <p className={styles.pastorColBody}>{column.body}</p>
            </div>
          ))}
        </div>

        <blockquote className={styles.pullQuote}>{pastor.pullQuote}</blockquote>
      </div>
    </section>
  );
}
