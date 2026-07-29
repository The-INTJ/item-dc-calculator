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
      <footer className={styles.cardActions}>
        {playing ? (
          <button type="button" className={styles.playButton} onClick={onStop}>
            ■ {content.candidates.stop}
          </button>
        ) : (
          <button type="button" className={styles.playButton} onClick={onPlayFull}>
            ▶ {content.candidates.playFull}
          </button>
        )}
        <button
          type="button"
          className={classes(styles.selectButton, selected && styles.selectButtonActive)}
          aria-pressed={selected}
          onClick={onSelect}
        >
          {selected ? content.candidates.selected : content.candidates.select}
        </button>
      </footer>
    </article>
  );
}
