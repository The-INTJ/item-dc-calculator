import { church, urls, visit } from '../content';
import styles from './MoriahDemo.module.scss';

export function MoriahVisit() {
  return (
    <section id="visit" className={styles.band} aria-labelledby="mo-visit-heading">
      <div className={`${styles.container} ${styles.visitGrid}`}>
        <div>
          <span className={styles.eyebrow}>{visit.eyebrow}</span>
          <h2 id="mo-visit-heading" className={styles.h2}>
            {visit.headline}
          </h2>
          <address className={styles.addressBlock}>
            {church.address.street}
            <br />
            {church.address.city}, {church.address.state} {church.address.zip}
          </address>
          <p style={{ marginTop: '1.75rem' }}>
            <a href={urls.maps} className={styles.buttonPrimary}>
              {visit.directionsCta}
            </a>
          </p>
        </div>

        <div className={styles.contactCard}>
          <div className={styles.contactGroup}>
            <p className={styles.contactLabel}>{visit.pastorLabel}</p>
            <p className={styles.contactName}>{visit.pastorName}</p>
            <p className={styles.contactDetail}>{visit.pastorAddress}</p>
            <p className={styles.contactDetail}>
              <a href={urls.pastorPhone} className={styles.textLink}>
                {visit.pastorPhoneDisplay}
              </a>
            </p>
          </div>
          <div className={styles.contactGroup}>
            <p className={styles.contactLabel}>{visit.deaconsLabel}</p>
            <ul className={styles.deaconList}>
              {visit.deacons.map((deacon) => (
                <li key={deacon}>{deacon}</li>
              ))}
            </ul>
          </div>
          <div className={styles.contactGroup}>
            <p className={styles.contactLabel}>{visit.clerkLabel}</p>
            <p className={styles.contactName}>{visit.clerk}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
