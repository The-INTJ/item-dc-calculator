'use client';

import { useEffect, useState } from 'react';
import type { CandidatePath } from '../../domain/analysis-types';
import type { VoiceEvent, VoiceId } from '../../domain/music-types';
import { newUserEventId } from '../shared/ids';
import type { InsertNoteOptions, StepNoteOptions } from '../useVoiceEventEditing';

/** The note-editing callbacks CandidateInspector receives from the workbench. */
interface NoteEditActions {
  onToggleNoteLock: (candidateId: string, event: VoiceEvent) => void;
  onStepNote: (
    candidateId: string,
    voice: VoiceId,
    eventId: string,
    direction: 1 | -1,
    options?: StepNoteOptions,
  ) => void;
  onInsertNote: (
    candidateId: string,
    voice: VoiceId,
    neighborEventId: string,
    side: 'before' | 'after',
    newEventId: string,
    options?: InsertNoteOptions,
  ) => void;
  onDeleteNote: (candidateId: string, voice: VoiceId, eventId: string) => void;
  onToggleNoteRest: (candidateId: string, voice: VoiceId, eventId: string) => void;
  onResizeNote: (
    candidateId: string,
    voice: VoiceId,
    eventId: string,
    edge: 'left' | 'right',
    targetBoundary: number,
    ripple: boolean,
    gestureId: string,
  ) => void;
}

/**
 * Note-editing selection for the inspector: which note's tool cluster is
 * open (scoped to the candidate it was opened on), Escape to close it, and
 * the per-voice handler bundle each VoiceLane needs — an insert selects the
 * new note, a delete clears a stale selection.
 */
export function useNoteEditing(candidate: CandidatePath | null, actions: NoteEditActions) {
  const [editing, setEditing] = useState<{ candidateId: string; eventId: string } | null>(null);
  // Editing selection is scoped to the candidate it was opened on.
  const editingEventId =
    editing && candidate && editing.candidateId === candidate.id ? editing.eventId : null;

  function editNote(eventId: string | null) {
    setEditing(eventId && candidate ? { candidateId: candidate.id, eventId } : null);
  }

  // Escape closes the note tool cluster.
  useEffect(() => {
    if (!editingEventId) return;
    function onKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === 'Escape') setEditing(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  /** The note-edit callbacks for one voice lane of the selected reading. */
  function laneNoteHandlers(selected: CandidatePath, voice: VoiceId) {
    return {
      onEditNote: editNote,
      onToggleLock: (event: VoiceEvent) => actions.onToggleNoteLock(selected.id, event),
      onStepNote: (eventId: string, direction: 1 | -1) =>
        actions.onStepNote(selected.id, voice, eventId, direction),
      onInsertNote: (neighborEventId: string, side: 'before' | 'after') => {
        const newEventId = newUserEventId();
        actions.onInsertNote(selected.id, voice, neighborEventId, side, newEventId);
        setEditing({ candidateId: selected.id, eventId: newEventId });
      },
      onDeleteNote: (eventId: string) => {
        actions.onDeleteNote(selected.id, voice, eventId);
        if (editingEventId === eventId) setEditing(null);
      },
      onResize: (
        eventId: string,
        edge: 'left' | 'right',
        targetBoundary: number,
        ripple: boolean,
        gestureId: string,
      ) => actions.onResizeNote(selected.id, voice, eventId, edge, targetBoundary, ripple, gestureId),
    };
  }

  return { editingEventId, laneNoteHandlers };
}
