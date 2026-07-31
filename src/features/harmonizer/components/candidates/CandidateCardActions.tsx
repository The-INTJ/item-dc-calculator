import { content } from '../../content';
import { Icon } from '../shared/Icon';
import styles from './CandidatePalette.module.scss';

interface CandidateCardActionsProps {
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
export function CandidateCardActions({
  selected,
  playing,
  onSelect,
  onPlayFull,
  onStop,
}: CandidateCardActionsProps) {
  return (
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
  );
}
