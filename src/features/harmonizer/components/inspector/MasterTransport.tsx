'use client';

import { content } from '../../content';
import { Icon } from '../shared/Icon';
import styles from './CandidateInspector.module.scss';

/**
 * The reading's master transport: a single Play button over the per-voice
 * checkboxes (play exactly the parts you check) that becomes Stop while this
 * reading is sounding.
 */
export function MasterTransport({
  playing,
  disabled,
  onPlay,
  onStop,
}: {
  playing: boolean;
  /** No voices checked — nothing to play. */
  disabled: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <div className={styles.transport}>
      {playing ? (
        <button
          type="button"
          className={styles.masterButton}
          aria-label={content.inspector.stop}
          title={content.inspector.stop}
          onClick={onStop}
        >
          <Icon name="stop" />
        </button>
      ) : (
        <button
          type="button"
          className={styles.masterButton}
          aria-label={content.inspector.play}
          title={content.inspector.play}
          onClick={onPlay}
          disabled={disabled}
        >
          <Icon name="play_arrow" />
        </button>
      )}
    </div>
  );
}
