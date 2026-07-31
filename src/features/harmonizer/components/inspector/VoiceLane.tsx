'use client';

import { content } from '../../content';
import type { ApproachVoice } from '../../domain/approach';
import type { VoiceEvent, VoiceId } from '../../domain/music-types';
import { toTimelineSpan, UNITS_PER_MEASURE } from '../../domain/timing';
import { voiceTermIds } from '../../knowledge/glossary';
import { BeatDots } from '../workspace/BeatDots';
import { Term } from '../shared/Term';
import { ApproachNote } from './ApproachNote';
import { LaneControls } from './LaneControls';
import { NoteCell, noteCellFlags } from './NoteCell';
import styles from './CandidateInspector.module.scss';

interface VoiceLaneProps {
  voice: VoiceId;
  events: VoiceEvent[];
  /** The note this voice arrives from when the snippet sits mid-hymn. */
  approach?: ApproachVoice;
  activeUnit: number | null;
  /** Total grid units — needed to convert drag pixels to boundaries. */
  gridUnits: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  soloing: boolean;
  onPlayVoice: () => void;
  onStop: () => void;
  editingEventId: string | null;
  onEditNote: (eventId: string | null) => void;
  lockedEventIds: ReadonlySet<string>;
  onToggleLock: (event: VoiceEvent) => void;
  onStepNote: (eventId: string, direction: 1 | -1) => void;
  onInsertNote: (neighborEventId: string, side: 'before' | 'after') => void;
  onDeleteNote: (eventId: string) => void;
  onResize: (
    eventId: string,
    edge: 'left' | 'right',
    targetBoundary: number,
    ripple: boolean,
    gestureId: string,
  ) => void;
}

/**
 * The lane's name (a chip-variant glossary Term — the part name teaches
 * itself) plus its approach note. Rendered twice: mobile puts the stacked
 * variant (and the controls) above the track; desktop uses the in-grid
 * variant. Exactly one is ever displayed, so only one reaches the
 * accessibility tree. The note cells stay Term-free: they are click-to-edit
 * surfaces.
 */
function LaneLabel({
  voice,
  voiceLabel,
  approach,
  inGrid,
}: {
  voice: VoiceId;
  voiceLabel: string;
  approach?: ApproachVoice;
  inGrid: boolean;
}) {
  return inGrid ? (
    <span className={styles.laneLabel} data-lane-label>
      <Term termId={voiceTermIds[voice]} variant="chip" className={styles.laneLabelText}>
        {voiceLabel}
      </Term>
      {approach ? <ApproachNote approach={approach} voiceLabel={voiceLabel} /> : null}
    </span>
  ) : (
    <span className={styles.laneLabelStacked}>
      <Term termId={voiceTermIds[voice]} variant="chip">
        {voiceLabel}
      </Term>
      {approach ? <ApproachNote approach={approach} voiceLabel={voiceLabel} /> : null}
    </span>
  );
}

export function VoiceLane({
  voice,
  events,
  approach,
  activeUnit,
  gridUnits,
  checked,
  onCheckedChange,
  soloing,
  onPlayVoice,
  onStop,
  editingEventId,
  onEditNote,
  lockedEventIds,
  onToggleLock,
  onStepNote,
  onInsertNote,
  onDeleteNote,
  onResize,
}: VoiceLaneProps) {
  const voiceLabel = content.inspector.voiceLabels[voice];
  const editingIndex = events.findIndex((event) => event.id === editingEventId);
  // Mirror of the reducer's one-measure cap (see measureCap in
  // workbenchReducer.ts): an insert grows the part by the clicked note's
  // length, so a ghost that would push past the cap is disabled with the
  // reason instead of silently no-oping.
  const partEnd = events.reduce((max, event) => {
    const span = toTimelineSpan(event.start, event.duration);
    return Math.max(max, span.startUnit - 1 + span.spanUnits);
  }, 0);
  const partCap = Math.max(UNITS_PER_MEASURE, partEnd);
  const laneContext = {
    activeUnit,
    editingEventId,
    editingIndex,
    lockedEventIds,
    partEnd,
    partCap,
    noteCount: events.length,
  };

  return (
    <div className={styles.lane}>
      <LaneLabel voice={voice} voiceLabel={voiceLabel} approach={approach} inGrid={false} />
      <div className={styles.laneTrackClip}>
        <div className={styles.laneGrid} data-lane-grid>
          <BeatDots gridUnits={gridUnits} />
          <LaneLabel voice={voice} voiceLabel={voiceLabel} approach={approach} inGrid />
          {events.map((event, index) => (
            <NoteCell
              key={event.id}
              event={event}
              {...noteCellFlags(event, index, laneContext)}
              gridUnits={gridUnits}
              onEditNote={onEditNote}
              onToggleLock={onToggleLock}
              onStepNote={onStepNote}
              onInsertNote={onInsertNote}
              onDeleteNote={onDeleteNote}
              onResize={onResize}
            />
          ))}
        </div>
      </div>
      <LaneControls
        voiceLabel={voiceLabel}
        checked={checked}
        onCheckedChange={onCheckedChange}
        soloing={soloing}
        onPlayVoice={onPlayVoice}
        onStop={onStop}
      />
    </div>
  );
}
