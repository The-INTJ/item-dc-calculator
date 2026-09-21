import Link from 'next/link';

import { church, footer, nav, routes, urls } from '../content';
import styles from './MoriahDemo.module.scss';

/** Sticky header shared by both pages of the preview. */
export function MoriahHeader() {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link href={routes.home} className={styles.brand}>
          <span className={styles.brandName}>{church.name}</span>
          <span className={styles.brandPlace}>
            {church.address.city}, {church.address.state}
          </span>
        </Link>
        <nav className={styles.headerNav} aria-label="Sections">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <a href={urls.maps} className={`${styles.buttonPrimary} ${styles.headerCta}`}>
          Plan your visit
        </a>
      </div>
    </header>
  );
}

export function MoriahFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.footerInvitation}>{footer.invitation}</p>
        <nav className={styles.footerLinks} aria-label="Footer">
          <Link href={`${routes.home}#sermons`}>Sermons</Link>
          <Link href={routes.news}>News &amp; Calendar</Link>
          <Link href={routes.directory}>Directory</Link>
          <Link href={`${routes.home}#beliefs`}>What We Believe</Link>
          <a href={urls.maps}>Directions</a>
          <a href={urls.history}>200 Years of Blessing</a>
        </nav>
        <p className={styles.footerNote}>
          {footer.note}
          <span className={styles.footerCopyright}>{footer.copyright}</span>
        </p>
      </div>
    </footer>
  );
}
