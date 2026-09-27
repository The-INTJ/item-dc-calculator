import { urls, visit } from '../../content';
import { contactPage, siteLabels } from '../content';
import styles from './ContactPage.module.scss';
import { Inscription } from './Inscription';
import { PanelLink } from './PanelLink';

/**
 * Contacts.htm, verbatim: the church's address with Directions, and the
 * officers — pastor, deacons, clerk — lettered in gold leaf on a painted
 * board, the way a church hall would list them.
 */
export function ContactPage() {
  return (
    <div className={styles.contact}>
      <section className={styles.address} aria-labelledby="mo2-church-address">
        <Inscription id="mo2-church-address">{contactPage.addressLabel}</Inscription>
        <address className={styles.street}>
          {contactPage.churchAddress.map((line) => (
            <span key={line} className={styles.line}>
              {line}
            </span>
          ))}
        </address>
        <PanelLink href={urls.maps} external>
          {siteLabels.directions}
        </PanelLink>
      </section>

      <section className={styles.board} aria-label={contactPage.heading}>
        <dl className={styles.officers}>
          <div className={styles.office}>
            <dt>{contactPage.pastorLabel}</dt>
            <dd className={styles.name}>{visit.pastorName}</dd>
            <dd className={styles.detail}>{contactPage.pastorAddress}</dd>
            <dd className={styles.detail}>
              <a href={urls.pastorPhone}>{visit.pastorPhoneDisplay}</a>
            </dd>
          </div>
          <div className={styles.office}>
            <dt>{contactPage.deaconsLabel}</dt>
            {visit.deacons.map((deacon) => (
              <dd key={deacon} className={styles.name}>
                {deacon}
              </dd>
            ))}
          </div>
          <div className={styles.office}>
            <dt>{contactPage.clerkLabel}</dt>
            <dd className={styles.name}>{visit.clerk}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
