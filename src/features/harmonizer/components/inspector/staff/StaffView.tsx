'use client';

import { buildStaffModel, STEM_DIRECTION_OF_VOICE } from '../../../domain/notation';
import type { CandidatePath } from '../../../domain/analysis-types';
import type { TonalContext } from '../../../domain/music-types';
import { durationToUnits, timeToUnits } from '../../../domain/timing';
import { AddNoteButtons } from './AddNoteButtons';
import { NoteGrid } from './NoteGrid';
import { NoteSprites } from './NoteSprites';
import { BARLINE_HEIGHT, BARLINE_TOP, StaffLines } from './StaffLines';
import { headWidthPx, SystemHead } from './SystemHead';
import { SYSTEM_HEIGHT_PX, unitX } from './staff-geometry';
import { useStaffSelection, type StaffEditing } from './useStaffSelection';
import styles from './StaffView.module.scss';

export type { StaffEditing } from './useStaffSelection';

interface StaffViewProps {
  candidate: CandidatePath;
  tonalContext: TonalContext;
  gridUnits: number;
  editing?: StaffEditing;
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
  const { selection, selected, placement, system, select, close, choose, add, toggleRest, remove } =
    useStaffSelection(candidate, editing);

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

        {editing ? (
          <AddNoteButtons candidate={candidate} gridUnits={model.gridUnits} onAdd={add} />
        ) : null}
      </span>

      {editing && selected && selection ? (
        <NoteGrid
          note={{
            pitch: selected.pitch,
            scaleDegree: selected.scaleDegree,
            units: durationToUnits(selected.duration),
            startUnit: timeToUnits(selected.start),
          }}
          tonalContext={tonalContext}
          stem={STEM_DIRECTION_OF_VOICE[selection.voice]}
          reach={editing.reach}
          side={placement.side}
          footer={{
            isRest: selected.isRest === true,
            // A part always keeps one note; silencing is how you empty a part
            // without emptying it.
            canDelete: candidate.voicing[selection.voice].length > 1,
            onToggleRest: toggleRest,
            onDelete: remove,
          }}
          onChoose={choose}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
