import { content } from '../../content';
import type { CandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import { MarkedText } from '../shared/MarkedText';
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

/**
 * Selection is an explicit button (Drew, 2026-07-30): the card body hosts
 * glossary term triggers in its prose, and a whole-card click target would
 * fight the term popovers — hovering a definition must never feel like it
 * risks switching the workspace.
 */
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
      aria-label={summary.title}
      data-selected={selected || undefined}
    >
      <header className={styles.cardHeader}>
        <span className={styles.cardLetter} aria-hidden="true">
          {letter}
        </span>
        <h3 className={styles.cardTitle}>{summary.title}</h3>
      </header>
      <p className={styles.cardPath}>
        <span className={styles.cardNumerals}>
          {/* Mid-hymn readings show the chord they grow out of. */}
          {summary.approachNumeral ? (
            <span className={styles.cardApproach}>{summary.approachNumeral} →</span>
          ) : null}
          {summary.romanNumeralPath}
        </span>
        <span className={styles.cardSymbols}>{summary.displaySymbolPath}</span>
      </p>
      <p className={styles.cardBass}>
        {content.candidates.bassPrefix}{' '}
        <span className={styles.cardBassOutline}>{summary.bassOutline}</span>
      </p>
      <p className={styles.cardSummary}>
        <MarkedText text={summary.summary} />
      </p>
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
        <button
          type="button"
          className={styles.selectButton}
          disabled={selected}
          onClick={onSelect}
        >
          {selected ? content.candidates.selectedCard : content.candidates.selectCard}
        </button>
        {playing ? (
          <button type="button" className={styles.playButton} onClick={onStop}>
            ■ {content.candidates.stop}
          </button>
        ) : (
          <button type="button" className={styles.playButton} onClick={onPlayFull}>
            ▶ {content.candidates.playFull}
          </button>
        )}
      </footer>
    </article>
  );
}
