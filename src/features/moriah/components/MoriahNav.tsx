'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { isNavGroup, nav, pageHref, type NavGroup, type PageKey } from '../content';
import styles from './MoriahDemo.module.scss';

/** True when this group contains the page currently being viewed. */
function groupHolds(group: NavGroup, current: PageKey): boolean {
  return group.items.some((item) => item.page === current);
}

function NavDropdown({
  group,
  current,
  open,
  onOpen,
  onClose,
}: {
  group: NavGroup;
  current: PageKey;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const menuId = `nav-${group.label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      className={styles.navGroup}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) onClose();
      }}
    >
      <button
        type="button"
        className={`${styles.navTrigger} ${groupHolds(group, current) ? styles.navCurrent : ''}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {group.label}
        <span className={styles.navCaret} aria-hidden="true">
          ▾
        </span>
      </button>
      <div className={`${styles.navMenu} ${open ? styles.navMenuOpen : ''}`} id={menuId}>
        {group.items.map((item) => (
          <Link
            key={item.page}
            href={pageHref(item.page)}
            className={item.page === current ? styles.navCurrent : ''}
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Header navigation. Groups open on hover and on click, and close on Escape
 * or on a click outside — hover alone would strand keyboard and touch users.
 */
export function MoriahNav({ current }: { current: PageKey }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (openLabel === null) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenLabel(null);
    }
    function onPointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpenLabel(null);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [openLabel]);

  return (
    <nav className={styles.headerNav} aria-label="Main" ref={navRef}>
      {nav.map((entry) =>
        isNavGroup(entry) ? (
          <NavDropdown
            key={entry.label}
            group={entry}
            current={current}
            open={openLabel === entry.label}
            onOpen={() => setOpenLabel(entry.label)}
            onClose={() => setOpenLabel(null)}
          />
        ) : (
          <Link
            key={entry.page}
            href={pageHref(entry.page)}
            className={`${styles.navLink} ${entry.page === current ? styles.navCurrent : ''}`}
          >
            {entry.label}
          </Link>
        ),
      )}
    </nav>
  );
}
