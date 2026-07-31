'use client';

import { useRef, useState } from 'react';
import { buildStaffModel, STEM_DIRECTION_OF_VOICE } from '../../../domain/notation';
import type { CandidatePath } from '../../../domain/analysis-types';
import type { TonalContext, VoiceId } from '../../../domain/music-types';
import { durationToUnits, toTimelineSpan } from '../../../domain/timing';
import { NoteGrid } from './NoteGrid';
import { NoteSprites } from './NoteSprites';
import type { GridCell } from './note-grid-cells';
import { BARLINE_HEIGHT, BARLINE_TOP, StaffLines } from './StaffLines';
import { headWidthPx, SystemHead } from './SystemHead';
import { SYSTEM_HEIGHT_PX, unitX } from './staff-geometry';
import { useGridPlacement } from './useGridPlacement';
import styles from './StaffView.module.scss';

/**
 * Whether notes can be changed from the staff, and how to change them.
 *
 * Editing is a capability the staff is granted rather than something it
 * assumes: without this prop the staff is a picture, which is what lets the
 * same component be shown anywhere a reading needs to be read rather than
 * worked on.
 */
export interface StaffEditing {
  /** How many steps the grid reaches in each direction. */
  reach: number;
  onStepPitch: (voice: VoiceId, eventId: string, direction: 1 | -1) => void;
  onSetLength: (voice: VoiceId, eventId: string, endUnit: number) => void;
}

interface StaffViewProps {
  candidate: CandidatePath;
  tonalContext: TonalContext;
  gridUnits: number;
  editing?: StaffEditing;
}

interface Selection {
  eventId: string;
  voice: VoiceId;
}

/**
 * The current measure as a grand staff, with the seven shapes on the noteheads.
 *
 * Horizontal position is a share of the track's width, so the staff stretches
 * with the same fluid grid the lanes use and every note stays over its own beat.
 * Vertical position is fixed pixels off one staff space, because a stave that
 * stretched would distort the shapes it exists to show.
 */
export function StaffView({ candidate, tonalContext, gridUnits, editing }: StaffViewProps) {
  const model = buildStaffModel(candidate.voicing, tonalContext, gridUnits);
  const headWidth = headWidthPx(model.staves[0]?.keySignature.length ?? 0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const placement = useGridPlacement();
  const system = useRef<HTMLDivElement>(null);

  const selected = selection
    ? candidate.voicing[selection.voice].find((event) => event.id === selection.eventId)
    : undefined;

  function close() {
    setSelection(null);
    placement.restore();
  }

  function select(voice: VoiceId, eventId: string) {
    // Tapping the note that is already open closes it, so the same tap both
    // opens and dismisses.
    if (selection?.eventId === eventId) {
      close();
      return;
    }
    setSelection({ eventId, voice });
    placement.open(system.current);
  }

  /**
   * Apply a cell and stay open. The grid re-centres on what was just chosen,
   * which is what makes a large move a repeat of the same small gesture.
   */
  function choose(cell: GridCell) {
    if (!editing || !selection || !selected || !cell.value) return;
    const span = toTimelineSpan(selected.start, selected.duration);
    const direction: 1 | -1 = cell.y > 0 ? 1 : -1;
    for (let taken = 0; taken < Math.abs(cell.y); taken += 1) {
      editing.onStepPitch(selection.voice, selection.eventId, direction);
    }
    if (cell.x !== 0) {
      editing.onSetLength(selection.voice, selection.eventId, span.startUnit - 1 + cell.value.units);
    }
  }

  return (
    <div
      className={styles.system}
      style={{ height: SYSTEM_HEIGHT_PX }}
      data-staff-system
      ref={system}
    >
      <StaffLines model={model} />
      <SystemHead model={model} />

      <span className={styles.track} style={{ left: headWidth }}>
        {model.barlineUnits.map((unit) => (
          <span
            key={`bar-${unit}`}
            className={styles.barline}
            style={{ left: unitX(unit, model.gridUnits), top: BARLINE_TOP, height: BARLINE_HEIGHT }}
          />
        ))}
        <span
          className={styles.barline}
          data-final
          style={{ right: 0, top: BARLINE_TOP, height: BARLINE_HEIGHT }}
        />

        {model.staves.map((stave) => (
          <NoteSprites
            key={stave.stave}
            stave={stave}
            gridUnits={model.gridUnits}
            selectedEventId={selection?.eventId ?? null}
            onSelect={editing ? select : undefined}
          />
        ))}
      </span>

      {editing && selected && selection ? (
        <NoteGrid
          note={{
            pitch: selected.pitch,
            scaleDegree: selected.scaleDegree,
            units: durationToUnits(selected.duration),
          }}
          tonalContext={tonalContext}
          stem={STEM_DIRECTION_OF_VOICE[selection.voice]}
          reach={editing.reach}
          side={placement.side}
          onChoose={choose}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
