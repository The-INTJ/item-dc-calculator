import type { HarmonyEvent } from '../../domain/music-types';
import { toTimelineSpan } from '../../domain/timing';
import { boundaryLeftPercent } from '../shared/timeGrid';
import styles from './BoundaryThroughLines.module.scss';

interface BoundaryThroughLinesProps {
  harmonyEvents: HarmonyEvent[];
  gridUnits: number;
}

/**
 * The straight vertical lines drawn through the SATB notes at each harmony
 * change, meeting the chord strip where its internal bars split the labels.
 * Rendered as a pointer-events-free overlay across the voice-lane stack,
 * positioned over the time-track area only (label track and controls column
 * excluded via the layout tokens).
 */
export function BoundaryThroughLines({ harmonyEvents, gridUnits }: BoundaryThroughLinesProps) {
  if (gridUnits === 0 || harmonyEvents.length < 2) return null;
  return (
    <div className={styles.overlay} aria-hidden="true">
      {harmonyEvents.slice(1).map((event) => {
        const span = toTimelineSpan(event.start, event.duration);
        const boundaryUnit = span.startUnit - 1;
        return (
          <span
            key={event.id}
            className={styles.line}
            style={{ left: boundaryLeftPercent(boundaryUnit, gridUnits) }}
          />
        );
      })}
    </div>
  );
}
