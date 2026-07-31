'use client';

import type { NoteSymbol, RestSymbol, StaffStave } from '../../../domain/notation';
import type { VoiceId } from '../../../domain/music-types';
import { content } from '../../../content';
import { HEAD_WIDTH_PX, shiftX, SPACE_PX, stepY, unitX } from './staff-geometry';
import styles from './StaffView.module.scss';

/**
 * A note's target is a little taller than its head but shorter than the gap to
 * the next step, so two voices a third apart never cover each other. Voices a
 * second or a unison apart do overlap vertically — those are already pushed
 * sideways by the collision rule, so they separate anyway.
 */
const HIT_HEIGHT_PX = SPACE_PX * 1.4;

interface StaffHitsProps {
  stave: StaffStave;
  gridUnits: number;
  selectedEventId: string | null;
  onSelect: (voice: VoiceId, eventId: string) => void;
}

/** A rest that is a silenced NOTE, not an empty stretch — the only kind worth
 *  pointing at, and the only way a silenced note can be brought back. */
type SilencedRest = RestSymbol & { eventId: string };

function silencedRests(rests: RestSymbol[]): SilencedRest[] {
  return rests.filter((rest): rest is SilencedRest => rest.eventId !== undefined);
}

/** Everything on one stave you can put a finger on, sized to the mark itself
 *  rather than to its time slot — a sixteenth's slot is too narrow to tap, and
 *  a whole note's is a whole measure wide. */
export function StaffHits({ stave, gridUnits, selectedEventId, onSelect }: StaffHitsProps) {
  function hit(
    key: string,
    mark: Pick<NoteSymbol, 'voice' | 'stave' | 'step' | 'startUnit'>,
    eventId: string,
    nudgePx: number,
    isRest: boolean,
  ) {
    return (
      <button
        key={key}
        type="button"
        className={styles.hit}
        data-event-id={eventId}
        data-rest={isRest || undefined}
        data-selected={eventId === selectedEventId || undefined}
        aria-label={content.noteGrid.label}
        style={{
          left: shiftX(unitX(mark.startUnit, gridUnits), nudgePx),
          top: stepY(mark.stave, mark.step) - HIT_HEIGHT_PX / 2,
          width: HEAD_WIDTH_PX,
          height: HIT_HEIGHT_PX,
        }}
        onClick={() => onSelect(mark.voice, eventId)}
      />
    );
  }

  return (
    <span className={styles.hits}>
      {stave.notes.map((note) =>
        hit(`hit-${note.id}`, note, note.eventId, note.offsetHead ? HEAD_WIDTH_PX : 0, false),
      )}
      {silencedRests(stave.rests).map((rest) =>
        hit(`hit-${rest.id}`, rest, rest.eventId, HEAD_WIDTH_PX * 0.3, true),
      )}
    </span>
  );
}
