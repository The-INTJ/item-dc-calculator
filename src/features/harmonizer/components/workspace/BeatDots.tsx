import { UNITS_PER_BEAT, UNITS_PER_MEASURE } from '../../domain/timing';
import { classes } from '../shared/format';
import { boundaryLeftPercent } from '../shared/timeGrid';
import styles from './BeatDots.module.scss';

/**
 * Translucent brown beat markers inside a voice lane: one dot at each beat
 * start, the downbeat (measure start) slightly larger and stronger. Painted
 * UNDER the note cells (first in DOM, no z-index), so they surface exactly in
 * the empty beats you drag notes into. Decorative only.
 * (4/4 assumption — see the meter ledger in domain/timing.ts.)
 */
export function BeatDots({ gridUnits }: { gridUnits: number }) {
  if (gridUnits <= 0) return null;
  const dots: Array<{ unit: number; downbeat: boolean }> = [];
  for (let unit = 0; unit < gridUnits; unit += UNITS_PER_BEAT) {
    dots.push({ unit, downbeat: unit % UNITS_PER_MEASURE === 0 });
  }
  return (
    <span className={styles.overlay} aria-hidden="true">
      {dots.map((dot) => (
        <span
          key={dot.unit}
          data-beat-dot
          data-downbeat={dot.downbeat || undefined}
          className={classes(
            styles.dot,
            dot.downbeat && styles.dotDownbeat,
            dot.unit === 0 && styles.dotFirst,
          )}
          style={{ left: boundaryLeftPercent(dot.unit, gridUnits) }}
        />
      ))}
    </span>
  );
}
