import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { contact } from '../../content';
import { stnFontVariables } from '../../fonts';
import { stnHref, stnNav, type StnPage } from '../../routes';
import nav from '../../styles/nav.module.scss';
import site from '../../styles/site.module.scss';
import typo from '../../styles/type.module.scss';
import { Button } from '../ui/Button';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle, themeBootScript } from './ThemeToggle';

function SiteNav({ current }: { current: StnPage }) {
  return (
    <nav className={nav.nav} aria-label="Main">
      <Link href={stnHref('home')} className={nav.brand}>
        <Image src="/sound-to-note/mark.png" alt="" width={55} height={40} priority />
        <span className={nav.brandText}>
          <span className={nav.brandName}>{contact.name}</span>
          <span className={nav.brandSub}>{contact.brand}</span>
        </span>
      </Link>
      <div className={nav.actions}>
        <div className={nav.links}>
          {stnNav.map((item) => (
            <Link
              key={item.page}
              href={stnHref(item.page)}
              aria-current={item.page === current ? 'page' : undefined}
              className={`${nav.link} ${item.page === current ? nav.linkActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <ThemeToggle />
        <MobileMenu current={current} />
        <Button href={stnHref('contact')} size="sm" className={nav.cta}>
          Book Alex
        </Button>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer className={site.footer}>
      <span className={`${typo.wordmark} ${typo.gradCool}`} style={{ fontSize: 18 }}>
        Sound to note
      </span>
      <span className={`${typo.label} ${site.footerMeta}`}>
        <span>© {contact.name}</span>
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
        <a href={contact.phoneHref}>{contact.phone}</a>
      </span>
    </footer>
  );
}

/**
 * Chrome shared by every page. `data-theme` is owned by the boot script and
 * ThemeToggle, never passed as a prop, so React re-renders cannot reset it.
 */
export function SiteShell({ page, children }: { page: StnPage; children: ReactNode }) {
  return (
    <div className={`${site.site} ${stnFontVariables}`} data-stn-site="" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      <SiteNav current={page} />
      <main className={site.main} key={page}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
