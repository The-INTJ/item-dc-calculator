'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { classes } from './format';
import styles from './PopoverMenu.module.scss';

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
  const rootRef = useRef<HTMLDivElement | null>(null);

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
          className={classes(styles.panel, align === 'right' && styles.panelRight)}
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
