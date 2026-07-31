'use client';

import { useRef, useState } from 'react';
import type { CandidatePath } from '../../../domain/analysis-types';
import type { VoiceId } from '../../../domain/music-types';
import { toTimelineSpan } from '../../../domain/timing';
import { newId, newUserEventId } from '../../shared/ids';
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
  /**
   * Every call carrying one click's gestureId belongs to one thing the user
   * did, however many of them there are, and undo takes them back together.
   */
  onStepPitch: (voice: VoiceId, eventId: string, direction: 1 | -1, gestureId: string) => void;
  onSetLength: (voice: VoiceId, eventId: string, endUnit: number, gestureId: string) => void;
  /** Add a note to the end of a part, matching the one before it. */
  onAddNote: (voice: VoiceId, afterEventId: string, newEventId: string) => void;
  /** Silence a note, or let a silenced one speak again. Reversible either way. */
  onToggleRest: (voice: VoiceId, eventId: string) => void;
  /** Remove a note outright. Unlike silencing, nothing is kept. */
  onDeleteNote: (voice: VoiceId, eventId: string) => void;
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
   *
   * A cell away from both axes takes several dispatches — one per half step,
   * then one for the length — but it was ONE click, so they all carry the same
   * gestureId and undo puts every part of it back at once.
   */
  function choose(cell: GridCell) {
    if (!editing || !selection || !selected || !cell.value) return;
    const gestureId = newId();
    const span = toTimelineSpan(selected.start, selected.duration);
    const direction: 1 | -1 = cell.y > 0 ? 1 : -1;
    for (let taken = 0; taken < Math.abs(cell.y); taken += 1) {
      editing.onStepPitch(selection.voice, selection.eventId, direction, gestureId);
    }
    if (cell.x !== 0) {
      editing.onSetLength(
        selection.voice,
        selection.eventId,
        span.startUnit - 1 + cell.value.units,
        gestureId,
      );
    }
  }

  /**
   * Add a note to a part and open the grid on it. The note arrives as a guess —
   * the part's previous pitch and length — and the grid opening on it is what
   * makes the guess safe: whatever it should have been is one tap away.
   */
  function add(voice: VoiceId, afterEventId: string) {
    if (!editing) return;
    const eventId = newUserEventId();
    editing.onAddNote(voice, afterEventId, eventId);
    setSelection({ eventId, voice });
    placement.open(system.current);
  }

  /** Silence the open note, or bring it back. The grid stays open on it either
   *  way — the whole point of a toggle is being able to hear it both ways. */
  function toggleRest() {
    if (!editing || !selection) return;
    editing.onToggleRest(selection.voice, selection.eventId);
  }

  /** Delete the open note. Nothing is left to keep the grid open on. */
  function remove() {
    if (!editing || !selection) return;
    editing.onDeleteNote(selection.voice, selection.eventId);
    close();
  }

  return { selection, selected, placement, system, select, close, choose, add, toggleRest, remove };
}
