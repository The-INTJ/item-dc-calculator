import Link from 'next/link';

import { church, urls } from '../../content';
import { contactPage, pastorPage, siteLabels } from '../content';
import { porticoHref } from '../routes';
import styles from './HomeInterior.module.scss';
import { HistoryPlaque } from './HistoryPlaque';
import { Inscription } from './Inscription';
import { PanelLink } from './PanelLink';
import { WindowLinks } from './WindowLinks';

/** Set large, a heading needs no closing stop; the words themselves are untouched. */
const FINISHED = pastorPage.message.statement.replace(/\.$/, '');

/**
 * The rooms past the doors. Every sentence here is Elder Bryson's own, from
 * his page on moriahpbc.org; every label is one of the site's own headings or
 * link names. Light rooms alternate with bands of the church's brick.
 */
export function HomeInterior() {
  const { message, vision, ministry } = pastorPage;

  return (
    <>
      <section className={styles.room} aria-labelledby="mo2-message">
        <Inscription id="mo2-message">{message.title}</Inscription>
        <p className={styles.lead}>{message.lead}</p>
        <p className={styles.finished}>{FINISHED}</p>
        <p className={styles.ref}>{message.statementRef}</p>
      </section>

      <WindowLinks />

      <section className={styles.room} aria-labelledby="mo2-vision">
        <Inscription id="mo2-vision">{vision.title}</Inscription>
        <p className={styles.statement}>{vision.well}</p>
        <p className={styles.support}>{vision.need}</p>
        <Link href={porticoHref('pastor')} className={styles.signature}>
          {pastorPage.name}
        </Link>
      </section>

      <HistoryPlaque />

      <section className={styles.room} aria-labelledby="mo2-pearl">
        <p className={styles.lead}>{ministry.pearlLead}</p>
        <p id="mo2-pearl" className={styles.pearl}>
          {ministry.pearl}
        </p>
        <p className={styles.ref}>{ministry.pearlRef}</p>
        <PanelLink href={ministry.listenHref} external>
          {siteLabels.listen}
        </PanelLink>
      </section>

      <section className={`${styles.room} ${styles.address}`} aria-labelledby="mo2-address">
        <Inscription id="mo2-address">{contactPage.addressLabel}</Inscription>
        <address className={styles.street}>
          {church.address.street}
          <br />
          {church.address.city}, {church.address.state} {church.address.zip}
        </address>
        <div className={styles.actions}>
          <PanelLink href={urls.maps} external>
            {siteLabels.directions}
          </PanelLink>
          <PanelLink href={porticoHref('contact')}>{siteLabels.contact}</PanelLink>
        </div>
      </section>
    </>
  );
}
