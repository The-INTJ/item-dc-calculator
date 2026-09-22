/**
 * A watchdog for client-side navigations that quietly die.
 *
 * `next/link` calls `preventDefault()` on the click and then hands the
 * navigation to the App Router. If the router can't complete it — a tab that
 * has been sitting open past its prefetch cache, a session the browser
 * restored against a newer deployment, an RSC fetch that never resolves — the
 * click does nothing at all and the only way out is a manual reload.
 *
 * Arm this alongside the click: if the URL hasn't moved by the time it fires,
 * hand the navigation back to the browser, which always works.
 */

export const NAV_FALLBACK_MS = 1200;

/**
 * Starts the watchdog for a navigation to `href`. Returns a cancel function —
 * call it before arming another one and on unmount.
 *
 * The timer only fires if the page is *still* where it started, so a
 * navigation that lands normally (or a user who moves somewhere else in the
 * meantime) is never yanked around.
 */
export function armNavigationFallback(href: string, delayMs: number = NAV_FALLBACK_MS): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const startedAt = window.location.pathname;
  const timer = window.setTimeout(() => {
    if (window.location.pathname === startedAt) {
      window.location.assign(href);
    }
  }, delayMs);

  return () => window.clearTimeout(timer);
}

/**
 * True when a click should navigate this tab — i.e. a plain left click, not a
 * middle click or a modifier-click the browser turns into a new tab/window.
 * Those are left entirely to the browser, watchdog included.
 */
export function opensInThisTab(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  return (
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}
