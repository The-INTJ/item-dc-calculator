import { content } from '../../content';
import type { CandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import { CandidateCardBody } from './CandidateCardBody';
import { CandidateCardActions } from './CandidateCardActions';
import { CandidateProvenance } from './CandidateProvenance';
import styles from './CandidatePalette.module.scss';

interface CandidateCardProps {
  summary: CandidatePathSummary;
  letter: string;
  selected: boolean;
  playing: boolean;
  /**
   * This IS the reading on the workbench, so the card stops advertising itself
   * as a suggestion and reports what is currently sounding instead.
   */
  current: boolean;
  /**
   * Where the reading came from and what the engine could/couldn't derive.
   * Local dev view only (shared/useDevFlag.ts) — a musician judges a reading
   * by how it sounds, not by which subsystem produced it.
   */
  showProvenance: boolean;
  onSelect: () => void;
  onPlayFull: () => void;
  onStop: () => void;
}

export function CandidateCard({
  summary,
  letter,
  selected,
  playing,
  current,
  showProvenance,
  onSelect,
  onPlayFull,
  onStop,
}: CandidateCardProps) {
  return (
    <article
      className={classes(
        styles.card,
        selected && styles.cardSelected,
        playing && styles.cardPlaying,
      )}
      aria-label={current ? content.candidates.currentHeading : summary.title}
      data-selected={selected || undefined}
      data-current={current || undefined}
    >
      <header className={styles.cardHeader}>
        <span className={styles.cardLetter} aria-hidden="true">
          {letter}
        </span>
        <h3 className={styles.cardTitle}>
          {current ? content.candidates.currentHeading : summary.title}
        </h3>
      </header>

      <CandidateCardBody summary={summary} current={current} />

      {showProvenance ? <CandidateProvenance summary={summary} /> : null}

      <CandidateCardActions
        selected={selected}
        playing={playing}
        onSelect={onSelect}
        onPlayFull={onPlayFull}
        onStop={onStop}
      />
    </article>
  );
}
