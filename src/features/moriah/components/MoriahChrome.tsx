import Link from 'next/link';

import { BASE_PATH, church, connect, footer, pageHref, urls, type PageKey } from '../content';
import styles from './MoriahDemo.module.scss';
import { MoriahNav } from './MoriahNav';

/** Sticky header, shared by every page of the preview. */
export function MoriahHeader({ current }: { current: PageKey }) {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link href={BASE_PATH} className={styles.brand}>
          <span className={styles.brandName}>{church.name}</span>
          <span className={styles.brandPlace}>
            {church.address.city}, {church.address.state}
          </span>
        </Link>
        <MoriahNav current={current} />
        <Link href={pageHref('visit')} className={`${styles.buttonPrimary} ${styles.headerCta}`}>
          Plan your visit
        </Link>
      </div>
    </header>
  );
}

export function MoriahFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.footerInvitation}>{footer.invitation}</p>

        <p className={styles.footerSocial}>
          <a href={urls.facebook} className={styles.socialLink}>
            <span aria-hidden="true">f</span>
            {connect.cta}
          </a>
          <span className={styles.placeholderTag}>{connect.placeholderTag}</span>
        </p>

        <nav className={styles.footerLinks} aria-label="Footer">
          <Link href={pageHref('sermons')}>Sermons</Link>
          <Link href={pageHref('blog')}>Blog</Link>
          <Link href={pageHref('news')}>News &amp; Calendar</Link>
          <Link href={pageHref('directory')}>Directory</Link>
          <Link href={pageHref('beliefs')}>What We Believe</Link>
          <Link href={pageHref('give')}>Give</Link>
          <a href={urls.maps}>Directions</a>
        </nav>

        <p className={styles.footerNote}>
          {footer.note}
          <span className={styles.footerCopyright}>{footer.copyright}</span>
        </p>
      </div>
    </footer>
  );
}
