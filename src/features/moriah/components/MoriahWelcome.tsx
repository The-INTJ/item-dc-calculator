import { welcome } from '../content';
import styles from './MoriahDemo.module.scss';

export function MoriahWelcome() {
  return (
    <section className={styles.band} aria-labelledby="mo-welcome-heading">
      <div className={`${styles.container} ${styles.welcomeGrid}`}>
        <div>
          <span className={styles.eyebrow}>{welcome.eyebrow}</span>
          <h2 id="mo-welcome-heading" className={styles.h2}>
            {welcome.headline}
          </h2>
          <p className={styles.lede}>{welcome.body}</p>
          <p className={styles.welcomeAttribution}>{welcome.attribution}</p>
        </div>
        <ul className={styles.pointList}>
          {welcome.points.map((point) => (
            <li key={point.title} className={styles.pointItem}>
              <h3 className={styles.pointTitle}>{point.title}</h3>
              <p className={styles.pointBody}>{point.body}</p>
              <span className={styles.pointSource}>{point.source}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
