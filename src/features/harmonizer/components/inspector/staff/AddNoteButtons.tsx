'use client';

import { content } from '../../../content';
import type { CandidatePath } from '../../../domain/analysis-types';
import type { VoiceId } from '../../../domain/music-types';
import { STAVE_OF_VOICE } from '../../../domain/notation';
import { partEndUnits, roomInMeasure } from '../../../domain/voice-editing';
import { Icon } from '../../shared/Icon';
import { ADD_STEP_OF_VOICE, stepY, unitX } from './staff-geometry';
import styles from './StaffView.module.scss';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

interface AddNoteButtonsProps {
  candidate: CandidatePath;
  gridUnits: number;
  onAdd: (voice: VoiceId, afterEventId: string) => void;
}

/**
 * One plus per part, standing at the point where that part's next note would
 * go — so the button is both the control and the answer to "where would it
 * land?". The outer voices sit outside their stave, the inner two in the gap
 * between the staves, each beside the part it belongs to.
 *
 * A part with no room left keeps its plus, greyed: the measure being full is
 * something worth being able to see, and a button that vanished would just
 * raise the question of where it went.
 */
export function AddNoteButtons({ candidate, gridUnits, onAdd }: AddNoteButtonsProps) {
  return (
    <span className={styles.adds}>
      {VOICES.map((voice) => {
        const events = candidate.voicing[voice];
        const last = events[events.length - 1];
        if (!last) return null;
        return (
          <button
            key={voice}
            type="button"
            className={styles.add}
            data-voice={voice}
            disabled={roomInMeasure(events) === 0}
            aria-label={content.staff.addNote[voice]}
            style={{
              left: unitX(partEndUnits(events), gridUnits),
              top: stepY(STAVE_OF_VOICE[voice], ADD_STEP_OF_VOICE[voice]),
            }}
            onClick={() => onAdd(voice, last.id)}
          >
            <Icon name="add" />
          </button>
        );
      })}
    </span>
  );
}
