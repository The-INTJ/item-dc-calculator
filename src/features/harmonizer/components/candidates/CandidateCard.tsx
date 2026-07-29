import { content } from '../../content';
import type { CandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import styles from './CandidatePalette.module.scss';

interface CandidateCardProps {
  summary: CandidatePathSummary;
  letter: string;
  selected: boolean;
  playing: boolean;
  onSelect: () => void;
  onPlayFull: () => void;
  onStop: () => void;
}

/** The whole card is the select target; the play button is the only inner control. */
export function CandidateCard({
  summary,
  letter,
  selected,
  playing,
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
      tabIndex={0}
      aria-label={`${content.candidates.selectCard}: ${summary.title}`}
      data-selected={selected || undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onSelect();
        }
      }}
    >
      <header className={styles.cardHeader}>
        <span className={styles.cardLetter} aria-hidden="true">
          {letter}
        </span>
        <h3 className={styles.cardTitle}>{summary.title}</h3>
      </header>
      <p className={styles.cardPath}>
        <span className={styles.cardNumerals}>{summary.romanNumeralPath}</span>
        <span className={styles.cardSymbols}>{summary.displaySymbolPath}</span>
      </p>
      <p className={styles.cardBass}>
        {content.candidates.bassPrefix}{' '}
        <span className={styles.cardBassOutline}>{summary.bassOutline}</span>
      </p>
      <p className={styles.cardSummary}>{summary.summary}</p>
      {summary.descriptorLabels.length > 0 ? (
        <p className={styles.cardBadges}>
          {summary.descriptorLabels.map((label) => (
            <span key={label} className={styles.badge}>
              {label}
            </span>
          ))}
        </p>
      ) : null}
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
      <footer className={styles.cardActions}>
        {playing ? (
          <button
            type="button"
            className={styles.playButton}
            onClick={(event) => {
              event.stopPropagation();
              onStop();
            }}
          >
            ■ {content.candidates.stop}
          </button>
        ) : (
          <button
            type="button"
            className={styles.playButton}
            onClick={(event) => {
              event.stopPropagation();
              onPlayFull();
            }}
          >
            ▶ {content.candidates.playFull}
          </button>
        )}
      </footer>
    </article>
  );
}
