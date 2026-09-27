import Link from 'next/link';

import { church, urls } from '../../content';
import { lockup, porticoLabels, siteLabels } from '../content';
import { porticoNav } from '../routes';
import styles from './Foundation.module.scss';

/**
 * The foundation every page comes down to: the porch floor the columns stand
 * on, a footing of brick, the steps with their iron rails, and the grounds
 * below with the church's name and address — its cornerstone.
 */
export function Foundation() {
  return (
    <footer className={styles.foundation}>
      <div className={styles.porchEdge} aria-hidden="true">
        <div className={styles.floor} />
        <div className={styles.footing} />
      </div>
      <div className={styles.stair} aria-hidden="true">
        <span className={styles.step} />
        <span className={`${styles.step} ${styles.stepLower}`} />
        <span className={styles.rail} />
        <span className={styles.rail} />
      </div>

      <div className={styles.grounds}>
        <p className={styles.stone}>
          <span className={styles.stoneName}>
            {lockup.first} {lockup.rest}
          </span>
          <span className={styles.stoneAddress}>
            {church.address.street} · {church.address.city}, {church.address.state}{' '}
            {church.address.zip}
          </span>
        </p>

        <nav aria-label="Footer">
          <ul className={styles.links}>
            {porticoNav.map((link) => (
              <li key={link.label}>
                {link.external ? (
                  <a href={link.href}>{link.label}</a>
                ) : (
                  <Link href={link.href}>{link.label}</Link>
                )}
              </li>
            ))}
            <li>
              <a href={urls.history}>{siteLabels.history}</a>
            </li>
          </ul>
        </nav>

        <p className={styles.preview}>{porticoLabels.preview}</p>
      </div>
    </footer>
  );
}
