import { content } from '../../content';
import type { VoiceEvent, VoiceId } from '../../domain/music-types';
import { toTimelineSpan } from '../../domain/timing';
import { classes, pitchDisplay } from '../shared/format';
import { isUnitActive, timeSpanStyle } from '../shared/timeGrid';
import styles from './CandidateInspector.module.scss';

interface VoiceLaneProps {
  voice: VoiceId;
  events: VoiceEvent[];
  /** The soprano is derived from the melody and is always locked (spec §9.8.2). */
  locked: boolean;
  activeUnit: number | null;
  /** Whether this part is included when the master Play button fires. */
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** True while this voice plays alone. */
  soloing: boolean;
  onPlayVoice: () => void;
  onStop: () => void;
}

export function VoiceLane({
  voice,
  events,
  locked,
  activeUnit,
  checked,
  onCheckedChange,
  soloing,
  onPlayVoice,
  onStop,
}: VoiceLaneProps) {
  const voiceLabel = content.inspector.voiceLabels[voice];
  return (
    <div className={styles.lane}>
      <div className={styles.laneGrid}>
        <span className={styles.laneLabel}>{voiceLabel}</span>
        {events.map((event) => {
          const span = toTimelineSpan(event.start, event.duration);
          const active = isUnitActive(span, activeUnit);
          return (
            <span
              key={event.id}
              className={classes(styles.voiceCell, active && styles.cellActive)}
              style={timeSpanStyle(span)}
              data-active={active || undefined}
            >
              <span className={styles.voiceSyllable}>
                {event.tieFromPrevious ? (
                  <span aria-hidden="true" className={styles.tieMark}>
                    ‿
                  </span>
                ) : null}
                {event.scaleDegree.syllable}
              </span>
              <span className={styles.voicePitch}>{pitchDisplay(event.pitch)}</span>
            </span>
          );
        })}
      </div>
      <div className={styles.laneControls}>
        <input
          type="checkbox"
          className={styles.voiceCheck}
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
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
            ■
          </button>
        ) : (
          <button
            type="button"
            className={styles.voicePlayButton}
            aria-label={`${content.inspector.playVoice}: ${voiceLabel}`}
            onClick={onPlayVoice}
          >
            ▶
          </button>
        )}
        {locked ? (
          <span className={styles.lockChip}>
            <span aria-hidden="true">🔒</span> {content.melody.lockedMelody}
          </span>
        ) : (
          <button type="button" className={styles.lockButton} disabled title={content.comingSoon}>
            {content.inspector.lockRow}
          </button>
        )}
      </div>
    </div>
  );
}
