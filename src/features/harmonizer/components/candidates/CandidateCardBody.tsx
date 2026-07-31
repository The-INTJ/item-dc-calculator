import { content } from '../../content';
import type { CandidatePathSummary } from '../../state/selectors';
import { MarkedText } from '../shared/MarkedText';
import styles from './CandidatePalette.module.scss';

interface CandidateCardBodyProps {
  summary: CandidatePathSummary;
  current: boolean;
}

/** What the reading says about itself: its chord path, its bass, its character. */
export function CandidateCardBody({ summary, current }: CandidateCardBodyProps) {
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
    <>
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
    </>
  );
}
