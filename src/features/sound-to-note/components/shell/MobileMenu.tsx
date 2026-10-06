'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { stnHref, stnNav, type StnPage } from '../../routes';
import styles from '../../styles/nav.module.scss';
import { Button } from '../ui/Button';

/**
 * Menu / close glyphs (Lucide's paths) drawn inline: the CDN mask would only
 * start loading the X when the menu first opens, leaving a blank button.
 */
function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
    </svg>
  );
}

/** Phone-width nav: a menu button that drops a sheet of the same links. */
export function MobileMenu({ current }: { current: StnPage }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="stn-menu"
        onClick={() => setOpen(!open)}
      >
        <MenuGlyph open={open} />
      </button>
      {open && (
        <div className={styles.sheet} id="stn-menu">
          <Link
            href={stnHref('home')}
            onClick={close}
            className={`${styles.link} ${current === 'home' ? styles.linkActive : ''}`}
          >
            Home
          </Link>
          {stnNav.map((item) => (
            <Link
              key={item.page}
              href={stnHref(item.page)}
              onClick={close}
              className={`${styles.link} ${item.page === current ? styles.linkActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <Button href={stnHref('contact')} onClick={close}>
            Book Alex
          </Button>
        </div>
      )}
    </>
  );
}
