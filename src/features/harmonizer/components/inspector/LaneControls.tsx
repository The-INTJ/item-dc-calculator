'use client';

import { content } from '../../content';
import { Icon } from '../shared/Icon';
import styles from './CandidateInspector.module.scss';

/**
 * A lane's playback controls: the include-in-play checkbox plus the solo
 * play/stop button.
 */
export function LaneControls({
  voiceLabel,
  checked,
  onCheckedChange,
  soloing,
  onPlayVoice,
  onStop,
}: {
  voiceLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  soloing: boolean;
  onPlayVoice: () => void;
  onStop: () => void;
}) {
  return (
    <div className={styles.laneControls}>
      <input
        type="checkbox"
        className={styles.voiceCheck}
        checked={checked}
        onChange={(changeEvent) => onCheckedChange(changeEvent.target.checked)}
        aria-label={`${voiceLabel}: ${content.inspector.includeInPlay}`}
        title={`${voiceLabel} — ${content.inspector.includeInPlay}`}
      />
      {soloing ? (
        <button
          type="button"
          className={styles.voicePlayButton}
          aria-label={`${content.inspector.stop}: ${voiceLabel}`}
          onClick={onStop}
        >
          <Icon name="stop" />
        </button>
      ) : (
        <button
          type="button"
          className={styles.voicePlayButton}
          aria-label={`${content.inspector.playVoice}: ${voiceLabel}`}
          onClick={onPlayVoice}
        >
          <Icon name="play_arrow" />
        </button>
      )}
    </div>
  );
}
