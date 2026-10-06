'use client';

import { useEffect } from 'react';

import styles from '../../styles/nav.module.scss';
import { Icon } from '../ui/primitives';

const STORAGE_KEY = 'stn-theme';
const SITE_SELECTOR = '[data-stn-site]';

function siteRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SITE_SELECTOR);
}

function readStoredTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * The theme lives on the site wrapper's `data-theme`, never in React state:
 * the inline script in SiteShell sets it before paint, and this button flips
 * it. Which icon shows is pure CSS, so nothing re-renders.
 */
export function ThemeToggle() {
  // Re-apply after a client navigation remounts the wrapper.
  useEffect(() => {
    const root = siteRoot();
    if (root) root.dataset.theme = readStoredTheme();
  }, []);

  function toggle() {
    const root = siteRoot();
    if (!root) return;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the switch still works for this page view.
    }
  }

  return (
    <button type="button" className={styles.round} aria-label="Toggle light/dark" onClick={toggle}>
      <span className={styles.sun}>
        <Icon name="sun" size={18} />
      </span>
      <span className={styles.moon}>
        <Icon name="moon" size={18} />
      </span>
    </button>
  );
}

/** Runs before paint so a light-mode visitor never sees a dark flash. */
export const themeBootScript = `try{if(localStorage.getItem('${STORAGE_KEY}')==='light')document.currentScript.parentElement.dataset.theme='light'}catch(e){}`;
