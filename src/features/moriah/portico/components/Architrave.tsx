'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { lockup, porticoLabels } from '../content';
import { PORTICO_PATH, porticoNav, type PorticoLink, type PorticoPage } from '../routes';
import styles from './Architrave.module.scss';
import { Oculus } from './Oculus';

/** A small gable, drawn from both eaves up to the ridge over a hovered or current item. */
function GableMark() {
  return (
    <svg className={styles.mark} viewBox="0 0 26 9" aria-hidden="true" focusable="false">
      <line x1="1" y1="8" x2="13" y2="1.5" pathLength={1} />
      <line x1="25" y1="8" x2="13" y2="1.5" pathLength={1} />
    </svg>
  );
}

function NavItem({ link, current }: { link: PorticoLink; current: PorticoPage }) {
  const content: ReactNode = (
    <>
      <GableMark />
      <span>{link.label}</span>
    </>
  );

  return (
    <li>
      {link.external ? (
        <a href={link.href} className={styles.item}>
          {content}
        </a>
      ) : (
        <Link
          href={link.href}
          className={styles.item}
          aria-current={link.page === current ? 'page' : undefined}
        >
          {content}
        </Link>
      )}
    </li>
  );
}

/**
 * The architrave — the beam under the frieze — carries the nav. It sticks to
 * the top of the window once the gable has scrolled away, and then shows a
 * small vent and the church's name so home is always one step away.
 */
export function Architrave({ current }: { current: PorticoPage }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <nav className={styles.architrave} data-stuck={stuck ? '' : undefined} aria-label="Main">
        <Link
          href={PORTICO_PATH}
          className={styles.home}
          aria-label={porticoLabels.home}
          aria-hidden={stuck ? undefined : true}
          tabIndex={stuck ? undefined : -1}
        >
          <Oculus idPrefix="architrave" className={styles.homeVent} />
          <span className={styles.homeName}>{lockup.first}</span>
        </Link>
        <ul className={styles.list}>
          {porticoNav.map((link) => (
            <NavItem key={link.label} link={link} current={current} />
          ))}
        </ul>
      </nav>
    </>
  );
}
