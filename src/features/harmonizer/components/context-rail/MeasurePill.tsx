import { content } from '../../content';
import type { AppliedFragment } from '../../domain/workbench-state';
import { toCandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import styles from './AcceptedContextRail.module.scss';

interface MeasurePillProps {
  applied: AppliedFragment;
  position: number;
  selected: boolean;
  sounding: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

/**
 * One measure of the hymn: its number and chord path load it into the editor,
 * the play button hears it alone. Selected and sounding are separate states —
 * whole-hymn playback moves the sounding one without changing what is loaded.
 */
export function MeasurePill({
  applied,
  position,
  selected,
  sounding,
  onSelect,
  onPlay,
}: MeasurePillProps) {
  return (
    <span
      className={classes(
        styles.appliedPiece,
        selected && styles.appliedPieceSelected,
        sounding && styles.appliedPieceSounding,
      )}
      data-selected={selected || undefined}
      data-sounding={sounding || undefined}
    >
      <button
        type="button"
        className={styles.appliedChip}
        title={content.acceptedRail.editPiece}
        aria-pressed={selected}
        onClick={onSelect}
      >
        {position}. {toCandidatePathSummary(applied.candidate).romanNumeralPath}
      </button>
      <button
        type="button"
        className={styles.piecePlay}
        aria-label={`${content.acceptedRail.playPiece}: ${position}`}
        title={content.acceptedRail.playPiece}
        onClick={onPlay}
      >
        <Icon name="play_arrow" />
      </button>
    </span>
  );
}
