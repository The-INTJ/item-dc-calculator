'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'harmonizer.view.v1';

/**
 * How the current measure is drawn. `both` shows the lanes and the staff
 * together — the staff says more at a glance, while the lanes stay the surface
 * you edit on, so seeing them side by side is a working arrangement rather than
 * a comparison.
 */
export type NotationView = 'lanes' | 'staff' | 'both';

export const NOTATION_VIEWS: NotationView[] = ['lanes', 'staff', 'both'];

const DEFAULT_VIEW: NotationView = 'lanes';

function isNotationView(value: string | null): value is NotationView {
  return value !== null && (NOTATION_VIEWS as string[]).includes(value);
}

/**
 * A device preference, not part of the hymn: it lives in its own storage key
 * beside the chosen instrument rather than in the project, so it never travels
 * with a saved piece — and deliberately outside the reducer, so undo moves the
 * music back without moving the furniture.
 *
 * Always the default on the server and on first paint; the stored choice is
 * read in an effect so hydration agrees.
 */
export function useViewPreference(): [NotationView, (view: NotationView) => void] {
  const [view, setView] = useState<NotationView>(DEFAULT_VIEW);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isNotationView(stored)) setView(stored);
    } catch {
      // storage unavailable — the default view is a fine place to work
    }
  }, []);

  function choose(next: NotationView) {
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — the choice just won't outlive this page view
    }
  }

  return [view, choose];
}
