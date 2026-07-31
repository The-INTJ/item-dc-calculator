import { testimonials } from '../content';
import styles from './PilatesMentorsDemo.module.scss';

export function PilatesMentorsStories() {
  return (
    <section
      id="stories"
      className={`${styles.band} ${styles.storiesBand}`}
      aria-labelledby="pm-stories-heading"
    >
      <div className={styles.container}>
        <span className={styles.eyebrow}>{testimonials.eyebrow}</span>
        <h2 id="pm-stories-heading" className={styles.h2}>
          {testimonials.headline}
        </h2>
        <div className={styles.quoteGrid}>
          {testimonials.quotes.map((item) => (
            <figure key={item.attribution} className={styles.quoteCard}>
              <blockquote className={styles.quoteText}>{item.quote}</blockquote>
              <figcaption className={styles.quoteAttribution}>{item.attribution}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
