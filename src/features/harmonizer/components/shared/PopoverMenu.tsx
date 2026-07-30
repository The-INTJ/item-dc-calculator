'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { classes } from './format';
import styles from './PopoverMenu.module.scss';

/** Breathing room between a menu panel and the edge of the screen. */
const VIEWPORT_MARGIN = 8;

interface PopoverMenuProps {
  triggerLabel: ReactNode;
  triggerClassName?: string;
  heading?: string;
  align?: 'left' | 'right';
  children: (close: () => void) => ReactNode;
}

/**
 * The one hand-rolled popover primitive (project switcher, samples, add-note,
 * accepted-harmony). Local open state, outside-click + Escape close. Kept
 * deliberately simple — no portal, so it stays inside the .workbench token
 * scope.
 */
export function PopoverMenu({
  triggerLabel,
  triggerClassName,
  heading,
  align = 'left',
  children,
}: PopoverMenuProps) {
  const [open, setOpen] = useState(false);
  /** Px nudge that pulls an off-screen panel back into view (see below). */
  const [shift, setShift] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /**
   * The panel is anchored to its trigger, and a trigger sitting near either
   * edge of a phone screen used to push the panel clean off it. Measure once
   * on open and slide it back inside. Runs before paint, and `shift` starts at
   * zero on every open, so the measurement is never of an already-shifted box.
   */
  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    if (rect.width === 0) return; // jsdom: no layout — leave it where CSS put it
    let delta = 0;
    if (rect.right > window.innerWidth - VIEWPORT_MARGIN) {
      delta = window.innerWidth - VIEWPORT_MARGIN - rect.right;
    }
    if (rect.left + delta < VIEWPORT_MARGIN) delta = VIEWPORT_MARGIN - rect.left;
    setShift(delta);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          ref={panelRef}
          className={classes(styles.panel, align === 'right' && styles.panelRight)}
          style={shift === 0 ? undefined : { transform: `translateX(${shift}px)` }}
          role="menu"
        >
          {heading ? <div className={styles.heading}>{heading}</div> : null}
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function PopoverMenuItem({
  onSelect,
  disabled,
  title,
  active,
  children,
}: {
  onSelect: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={classes(styles.item, active && styles.itemActive)}
      disabled={disabled}
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {children}
    </button>
  );
}
