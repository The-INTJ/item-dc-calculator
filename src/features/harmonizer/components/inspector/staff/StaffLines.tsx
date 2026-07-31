'use client';

import { STAFF_LINE_STEPS, type StaffModel } from '../../../domain/notation';
import { stepY } from './staff-geometry';
import styles from './StaffView.module.scss';

/**
 * The stave lines themselves. They run the full width of the system, under the
 * clefs as well as the music, which is what makes two staves read as one system
 * rather than as two separate strips. Barlines are drawn on the track layer
 * instead, where positions are already measured in musical time.
 */
export function StaffLines({ model }: { model: StaffModel }) {
  return (
    <span className={styles.lines} aria-hidden="true">
      {model.staves.map((stave) =>
        STAFF_LINE_STEPS.map((step) => (
          <span
            key={`${stave.stave}-${step}`}
            className={styles.staffLine}
            style={{ top: stepY(stave.stave, step) }}
          />
        )),
      )}
    </span>
  );
}

/** The height a barline spans: from the top stave's top line to the bottom stave's last. */
export const BARLINE_TOP = stepY('treble', 0);
export const BARLINE_HEIGHT = stepY('bass', 8) - stepY('treble', 0);
