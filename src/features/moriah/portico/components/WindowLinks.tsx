import Link from 'next/link';

import { siteLabels } from '../content';
import { porticoHref, type PorticoPage } from '../routes';
import styles from './WindowLinks.module.scss';

const WINDOWS: readonly { page: PorticoPage; label: string }[] = [
  { page: 'pastor', label: siteLabels.pastor },
  { page: 'faith', label: siteLabels.faith },
  { page: 'sermons', label: siteLabels.sermons },
  { page: 'calendar', label: siteLabels.calendar },
];

/**
 * The ways in, as the church's own windows at dusk: one-over-one sashes in
 * white frames on the brick, each lettered in gold leaf with one of the live
 * site's page names. Hover turns the lamp up behind the glass.
 */
export function WindowLinks() {
  return (
    <nav className={styles.wall} aria-label="Pages">
      <ul className={styles.row}>
        {WINDOWS.map((window) => (
          <li key={window.page}>
            <Link href={porticoHref(window.page)} className={styles.window}>
              <span className={styles.upper} aria-hidden="true" />
              <span className={styles.lower}>
                <span className={styles.gilt}>{window.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
