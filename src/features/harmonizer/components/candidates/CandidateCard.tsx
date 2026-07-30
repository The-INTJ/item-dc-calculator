import { content } from '../../content';
import type { CandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import { MarkedText } from '../shared/MarkedText';
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
  current,
  showProvenance,
  onSelect,
  onPlayFull,
  onStop,
}: CandidateCardProps) {
  /**
   * The reading's name is a claim about character, and after enough editing it
   * can outlive the notes that earned it. On the current-chords card it is
   * demoted to a chip and shown only when something still stands behind it:
   * a name that merely restates the chord path (the engine's own
   * `titleFromHarmony`) says nothing the line above it hasn't already said.
   */
  const nameChip =
    summary.title && summary.title !== summary.romanNumeralPath ? summary.title : null;
  const readingChips = current
    ? [nameChip, ...summary.descriptorLabels].filter((label): label is string => Boolean(label))
    : summary.descriptorLabels;

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
      {/* The current-chords card carries no prose: it describes the workbench,
          which is right there above it. Everything it says is a chip. */}
      {current ? null : (
        <p className={styles.cardSummary}>
          <MarkedText text={summary.summary} />
        </p>
      )}
      {readingChips.length > 0 ? (
        <p className={styles.cardBadges}>
          {current ? (
            <span className={styles.readingLabel}>{content.candidates.workingReading}</span>
          ) : null}
          {readingChips.map((label) => (
            <span key={label} className={styles.badge}>
              {label}
            </span>
          ))}
        </p>
      ) : null}
      {showProvenance ? (
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
                {content.derivabilityStatus[note.status]}{' '}
                {content.derivabilityAspects[note.aspect]}
              </span>
            ))}
          </p>
          {summary.source !== 'authored' ? (
            <p className={styles.derivLegend}>{content.provenance.legend}</p>
          ) : null}
        </>
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
          <button
            type="button"
            className={styles.playButton}
            aria-label={content.candidates.stop}
            title={content.candidates.stop}
            onClick={onStop}
          >
            <Icon name="stop" />
          </button>
        ) : (
          <button
            type="button"
            className={styles.playButton}
            aria-label={content.candidates.playFull}
            title={content.candidates.playFull}
            onClick={onPlayFull}
          >
            <Icon name="play_arrow" />
          </button>
        )}
      </footer>
    </article>
  );
}
