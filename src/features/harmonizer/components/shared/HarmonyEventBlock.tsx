import type { HarmonyEvent } from '../../domain/music-types';
import { toTimelineSpan } from '../../domain/timing';
import { classes } from './format';
import { timeSpanStyle } from './timeGrid';
import styles from './HarmonyEventBlock.module.scss';

interface HarmonyEventBlockProps {
  event: HarmonyEvent;
  active: boolean;
}

/** Chord block aligned to the time grid; used by the plan lane and the inspector. */
export function HarmonyEventBlock({ event, active }: HarmonyEventBlockProps) {
  const span = toTimelineSpan(event.start, event.duration);
  return (
    <div
      className={classes(styles.block, active && styles.blockActive)}
      style={timeSpanStyle(span)}
      data-active={active || undefined}
    >
      <span className={styles.numeral}>{event.analysis.romanNumeral}</span>
      <span className={styles.symbol}>{event.displaySymbol}</span>
    </div>
  );
}
