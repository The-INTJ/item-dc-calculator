import { connect, urls } from '../content';
import styles from './MoriahDemo.module.scss';

/**
 * Facebook is the only place the congregation is today, so it is the only
 * channel offered here. The link itself is mocked — see content.ts.
 */
export function MoriahConnect() {
  return (
    <section className={`${styles.band} ${styles.bandStone}`} aria-labelledby="mo-connect-heading">
      <div className={`${styles.container} ${styles.connectInner}`}>
        <div>
          <span className={styles.eyebrow}>{connect.eyebrow}</span>
          <h2 id="mo-connect-heading" className={styles.h2}>
            {connect.headline}
          </h2>
          <p className={styles.lede}>{connect.body}</p>
        </div>
        <p className={styles.connectAction}>
          <a href={urls.facebook} className={styles.buttonPrimary}>
            {connect.cta}
          </a>
          <span className={styles.placeholderTag}>{connect.placeholderTag}</span>
        </p>
      </div>
    </section>
  );
}
