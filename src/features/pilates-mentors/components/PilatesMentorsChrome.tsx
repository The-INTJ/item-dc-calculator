import Image from 'next/image';

import { footer, hero, nav, pmUrls } from '../content';
import styles from './PilatesMentorsDemo.module.scss';

/**
 * Site chrome for the preview: sticky header with nav/CTAs, and the footer.
 */
export function PilatesMentorsHeader() {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <a href={pmUrls.home} className={styles.brand}>
          <Image
            src="/pilates-mentors/owl-blue.png"
            alt=""
            width={40}
            height={40}
            className={styles.brandMark}
          />
          <span className={styles.brandName}>Pilates Mentors</span>
        </a>
        <nav className={styles.headerNav} aria-label="Sections">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a href={pmUrls.account} className={styles.loginLink}>
            Log in
          </a>
          <a href={pmUrls.pricing} className={styles.buttonPrimary}>
            {hero.primaryCta}
          </a>
        </div>
      </div>
    </header>
  );
}

export function PilatesMentorsFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerInner}>
          <a href={pmUrls.home} className={styles.brand}>
            <Image
              src="/pilates-mentors/owl-blue.png"
              alt=""
              width={40}
              height={40}
              className={styles.brandMark}
            />
            <span className={styles.brandName}>Pilates Mentors</span>
          </a>
          <nav className={styles.footerLinks} aria-label="Contact and social">
            <a href={pmUrls.email}>{footer.email}</a>
            <a href={pmUrls.instagram}>Instagram</a>
            <a href={pmUrls.facebook}>Facebook</a>
          </nav>
        </div>
        <p className={styles.footerNote}>
          {footer.note} {footer.copyright}
        </p>
      </div>
    </footer>
  );
}
