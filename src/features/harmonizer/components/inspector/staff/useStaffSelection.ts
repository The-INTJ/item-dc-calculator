'use client';

import { useRef, useState } from 'react';
import type { CandidatePath } from '../../../domain/analysis-types';
import type { VoiceId } from '../../../domain/music-types';
import { toTimelineSpan } from '../../../domain/timing';
import type { GridCell } from './note-grid-cells';
import { useGridPlacement } from './useGridPlacement';

/**
 * Whether notes can be changed from the staff, and how to change them.
 *
 * Editing is a capability the staff is granted rather than something it
 * assumes: without this the staff is a picture, which is what lets the same
 * component be shown anywhere a reading needs to be read rather than worked on.
 */
export interface StaffEditing {
  /** How many steps the grid reaches in each direction. */
  reach: number;
  onStepPitch: (voice: VoiceId, eventId: string, direction: 1 | -1) => void;
  onSetLength: (voice: VoiceId, eventId: string, endUnit: number) => void;
}

interface Selection {
  eventId: string;
  voice: VoiceId;
}

/** Which note on the staff is open for editing, and what choosing a cell does to it. */
export function useStaffSelection(candidate: CandidatePath, editing: StaffEditing | undefined) {
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

  return { selection, selected, placement, system, select, close, choose };
}
