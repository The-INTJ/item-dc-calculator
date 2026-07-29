import { content } from '../../content';
import type { BoundaryConstraint, MelodyFragment } from '../../domain/music-types';
import { toTimelineSpan } from '../../domain/timing';
import { boundaryLeftPercent } from '../shared/timeGrid';
import styles from './CandidateInspector.module.scss';

interface BoundaryRowProps {
  fragment: MelodyFragment;
  boundaryConstraints: BoundaryConstraint[];
  /** Shared grid width in units — must match the voice lanes' grid. */
  gridUnits: number;
}

/**
 * Boundary chips sit on the exact grid line between adjacent melody events
 * (percentage offsets over the gap-less time tracks). The interactive
 * three-state control arrives with the editing milestone; this renders the
 * fixture's policies.
 */
export function BoundaryRow({ fragment, boundaryConstraints, gridUnits }: BoundaryRowProps) {
  const total = gridUnits;
  if (total === 0 || boundaryConstraints.length === 0) return null;
  return (
    <div className={styles.lane}>
      <div className={styles.laneGrid}>
        <span className={styles.laneLabel} aria-hidden="true" />
        <div className={styles.boundaryTrack}>
          {boundaryConstraints.map((constraint) => {
            const event = fragment.events.find(
              (melodyEvent) => melodyEvent.id === constraint.afterMelodyEventId,
            );
            if (!event) return null;
            const span = toTimelineSpan(event.start, event.duration);
            const boundaryUnit = span.startUnit - 1 + span.spanUnits;
            return (
              <span
                key={constraint.afterMelodyEventId}
                className={styles.boundaryChip}
                style={{ left: boundaryLeftPercent(boundaryUnit, total) }}
              >
                {content.boundaries[constraint.policy]}
              </span>
            );
          })}
        </div>
      </div>
      <div className={styles.laneControls} aria-hidden="true" />
    </div>
  );
}
