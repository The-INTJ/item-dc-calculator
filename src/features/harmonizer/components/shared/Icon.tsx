import { classes } from './format';
import styles from './Icon.module.scss';

/** The workbench's whole icon vocabulary — Material Symbols ligature names. */
export type IconName =
  | 'play_arrow'
  | 'stop'
  | 'keyboard_arrow_up'
  | 'keyboard_arrow_down'
  | 'lock'
  | 'lock_open'
  | 'close'
  | 'expand_more'
  | 'add'
  | 'east'
  | 'undo'
  | 'redo'
  | 'tune'
  | 'library_add'
  | 'delete';

interface IconProps {
  name: IconName;
  /** Unfilled glyph weight — locks, chevrons, and other outline-reading marks. */
  outlined?: boolean;
  className?: string;
}

/**
 * One Material Symbol. Always decorative: every call site is either a button
 * with its own aria-label or text that already says the same thing, so the
 * glyph is hidden from the accessibility tree (an unstyled ligature would
 * otherwise be announced as the literal word "play_arrow").
 */
export function Icon({ name, outlined, className }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={classes(styles.icon, outlined && styles.iconOutlined, className)}
    >
      {name}
    </span>
  );
}
