import { content } from '../../content';
import type { CandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import styles from './CandidatePalette.module.scss';

/**
 * Where the reading came from and what the engine could or couldn't derive.
 * Local dev view only (shared/useDevFlag.ts) — a musician judges a reading by
 * how it sounds, not by which subsystem produced it.
 */
export function CandidateProvenance({ summary }: { summary: CandidatePathSummary }) {
  return (
    <>
      <p className={styles.cardProvenance}>
        <span
          className={classes(
            styles.provBadge,
            summary.source === 'computed' && styles.provBadgeComputed,
          )}
        >
          {content.provenance[summary.source]}
        </span>
        {summary.derivability.map((note) => (
          <span
            key={note.aspect}
            className={styles.derivChip}
            data-status={note.status}
            title={note.note}
          >
            {content.derivabilityStatus[note.status]} {content.derivabilityAspects[note.aspect]}
          </span>
        ))}
      </p>
      {summary.source !== 'authored' ? (
        <p className={styles.derivLegend}>{content.provenance.legend}</p>
      ) : null}
    </>
  );
}
