import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { armNavigationFallback, NAV_FALLBACK_MS, opensInThisTab } from './navigationFallback';

const plainClick = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

function spyOnAssign() {
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, assign, get pathname() { return window.history.state?.path ?? '/plants'; } },
  });
  return assign;
}

describe('armNavigationFallback', () => {
  let assign: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  function goTo(path: string) {
    window.history.replaceState({ path }, '', path);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState({ path: '/plants' }, '', '/plants');
    assign = spyOnAssign();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('hands the navigation to the browser when the URL never moved', () => {
    armNavigationFallback('/');

    vi.advanceTimersByTime(NAV_FALLBACK_MS);

    expect(assign).toHaveBeenCalledWith('/');
  });

  it('stays quiet while the watchdog has not yet fired', () => {
    armNavigationFallback('/');

    vi.advanceTimersByTime(NAV_FALLBACK_MS - 1);

    expect(assign).not.toHaveBeenCalled();
  });

  it('stays out of the way once the router has landed the navigation', () => {
    armNavigationFallback('/');
    goTo('/');

    vi.advanceTimersByTime(NAV_FALLBACK_MS);

    expect(assign).not.toHaveBeenCalled();
  });

  it('never yanks back a user who moved on somewhere else', () => {
    armNavigationFallback('/');
    goTo('/donuts');

    vi.advanceTimersByTime(NAV_FALLBACK_MS);

    expect(assign).not.toHaveBeenCalled();
  });

  it('does not fire after it is cancelled', () => {
    const cancel = armNavigationFallback('/');
    cancel();

    vi.advanceTimersByTime(NAV_FALLBACK_MS);

    expect(assign).not.toHaveBeenCalled();
  });
});

describe('opensInThisTab', () => {
  it('accepts a plain left click', () => {
    expect(opensInThisTab(plainClick)).toBe(true);
  });

  it('leaves middle clicks and modifier clicks to the browser', () => {
    expect(opensInThisTab({ ...plainClick, button: 1 })).toBe(false);
    expect(opensInThisTab({ ...plainClick, ctrlKey: true })).toBe(false);
    expect(opensInThisTab({ ...plainClick, metaKey: true })).toBe(false);
    expect(opensInThisTab({ ...plainClick, shiftKey: true })).toBe(false);
    expect(opensInThisTab({ ...plainClick, altKey: true })).toBe(false);
  });
});
