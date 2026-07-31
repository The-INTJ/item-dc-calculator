import { hubs } from '../content';
import styles from './PilatesMentorsDemo.module.scss';

export function PilatesMentorsHubs() {
  return (
    <section id="membership" className={styles.band} aria-labelledby="pm-hubs-heading">
      <div className={styles.container}>
        <span className={styles.eyebrow}>{hubs.eyebrow}</span>
        <h2 id="pm-hubs-heading" className={styles.h2}>
          {hubs.headline}
        </h2>
        <div className={styles.hubList}>
          {hubs.items.map((hub) => (
            <a key={hub.number} href={hub.href} className={styles.hubCard}>
              <span className={styles.hubNumber}>{hub.number}</span>
              <h3 className={styles.hubOutcome}>{hub.outcome}</h3>
              <p className={styles.hubTitle}>{hub.title}</p>
              <p className={styles.hubBody}>{hub.body}</p>
              <span className={styles.hubLink}>Explore the hub →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
