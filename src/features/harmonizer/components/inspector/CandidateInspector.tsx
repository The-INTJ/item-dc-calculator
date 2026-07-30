'use client';

import { useEffect, useId, useState } from 'react';
import { content } from '../../content';
import type { CandidatePath } from '../../domain/analysis-types';
import type { MelodyFragment, VoiceEvent, VoiceId } from '../../domain/music-types';
import { totalUnits, UNITS_PER_MEASURE, voicingUnits } from '../../domain/timing';
import type { PlaybackState, SuggestionSource } from '../../domain/workbench-state';
import { BoundaryThroughLines } from '../workspace/BoundaryThroughLines';
import { ChordStrip } from '../workspace/ChordStrip';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import { newUserEventId } from '../shared/ids';
import { needsPan, panForUnit, panShiftPercent, trackScale } from '../shared/pan';
import { cssVars } from '../shared/timeGrid';
import { AnalysisDrawer } from './AnalysisDrawer';
import { EffectSummary } from './EffectSummary';
import { VoiceLane } from './VoiceLane';
import styles from './CandidateInspector.module.scss';

interface CandidateInspectorProps {
  candidate: CandidatePath | null;
  fragment: MelodyFragment;
  playback: PlaybackState;
  checkedVoices: VoiceId[];
  lockedEventIds: ReadonlySet<string>;
  suggestionSource: SuggestionSource | null;
  onToggleVoice: (voice: VoiceId, checked: boolean) => void;
  onPlayChecked: () => void;
  onPlayVoice: (candidateId: string, voice: VoiceId) => void;
  onStop: () => void;
  onToggleNoteLock: (candidateId: string, event: VoiceEvent) => void;
  onStepNote: (candidateId: string, voice: VoiceId, eventId: string, direction: 1 | -1) => void;
  onInsertNote: (
    candidateId: string,
    voice: VoiceId,
    neighborEventId: string,
    side: 'before' | 'after',
    newEventId: string,
  ) => void;
  onDeleteNote: (candidateId: string, voice: VoiceId, eventId: string) => void;
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

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

/**
 * The main workspace: the selected reading's four voices, harmonic
 * boundaries, and chord path, aligned on one time grid. Playback is a single
 * Play button over per-voice checkboxes (play exactly the parts you check),
 * plus a solo button on each lane.
 */
export function CandidateInspector({
  candidate,
  fragment,
  playback,
  checkedVoices,
  lockedEventIds,
  suggestionSource,
  onToggleVoice,
  onPlayChecked,
  onPlayVoice,
  onStop,
  onToggleNoteLock,
  onStepNote,
  onInsertNote,
  onDeleteNote,
  onResizeNote,
}: CandidateInspectorProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<{ candidateId: string; eventId: string } | null>(null);
  /** 0–1 slider position for the mobile note track (see shared/pan.ts). */
  const [pan, setPan] = useState(0);
  /** The How-to-use gesture hints fold, closed by default (mobile concision). */
  const [hintsOpen, setHintsOpen] = useState(false);
  const hintsId = useId();

  /**
   * Scoped to THIS reading: whole-hymn playback runs on the rail's own
   * timeline, so it must not move this cursor or turn this transport into a
   * Stop button.
   */
  const playing =
    playback.status === 'playing' && candidate !== null && playback.candidateId === candidate.id;
  const activeUnit = playing ? playback.activeUnit : null;
  // Editing selection is scoped to the candidate it was opened on.
  const editingEventId =
    editing && candidate && editing.candidateId === candidate.id ? editing.eventId : null;
  // The editor viewport is a fixed single measure: a fresh one-beat
  // continuation renders inside the full four beats with all sixteen snap
  // positions visible. The grid widens only for legacy content that outgrew
  // a measure before the cap existed. (4/4 assumption — see the meter ledger
  // in domain/timing.ts.)
  const gridUnits = Math.max(
    UNITS_PER_MEASURE,
    totalUnits(fragment),
    candidate ? voicingUnits(candidate.voicing) : 0,
  );

  /**
   * Mobile note panning, measured in beats: the window holds the default
   * fragment's one measure and anything longer slides. Every lane and the
   * chord strip share the scale, so they pan in lockstep. While playing, the
   * pan is derived from the cursor so the view follows the music; when
   * playback stops `activeUnit` goes null and the slider's own position takes
   * over again.
   */
  const scale = trackScale(gridUnits);
  const effectivePan = activeUnit !== null ? panForUnit(activeUnit, gridUnits, scale) : pan;
  const panVars = {
    '--wb-time-units': gridUnits,
    '--wb-track-scale': scale,
    '--wb-pan-shift': panShiftPercent(effectivePan, scale),
    '--wb-pan-shadow-left': scale > 1 && effectivePan > 0.002 ? 1 : 0,
    '--wb-pan-shadow-right': scale > 1 && effectivePan < 0.998 ? 1 : 0,
  };

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

  return (
    <div>
      {/* The three gestures you can't guess from looking, folded behind a
          disclosure ABOVE the section title — open, they render large enough
          to read while trying them. */}
      {candidate ? (
        <div className={styles.howToUse}>
          <button
            type="button"
            className={styles.howToUseToggle}
            aria-expanded={hintsOpen}
            aria-controls={hintsId}
            onClick={() => setHintsOpen((value) => !value)}
          >
            {content.inspector.howToUse}
            <Icon
              name="expand_more"
              className={classes(styles.chevron, hintsOpen && styles.chevronOpen)}
            />
          </button>
          {hintsOpen ? (
            <ul className={styles.hints} id={hintsId}>
              {content.inspector.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Just the region name and, in line with it, the transport — the
          reading's own name lives below with the analysis, not up here. */}
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>{content.regions.inspector}</h2>
        {candidate ? (
          <div className={styles.transport}>
            {playing ? (
              <button
                type="button"
                className={styles.masterButton}
                aria-label={content.inspector.stop}
                title={content.inspector.stop}
                onClick={onStop}
              >
                <Icon name="stop" />
              </button>
            ) : (
              <button
                type="button"
                className={styles.masterButton}
                aria-label={content.inspector.play}
                title={content.inspector.play}
                onClick={onPlayChecked}
                disabled={checkedVoices.length === 0}
              >
                <Icon name="play_arrow" />
              </button>
            )}
          </div>
        ) : null}
      </div>

      {!candidate ? (
        <p className={styles.noSelection}>{content.inspector.noSelection}</p>
      ) : (
        <div className={styles.lanes} style={cssVars(panVars)}>
          <div className={styles.laneStack}>
            {VOICES.map((voice) => (
              <VoiceLane
                key={voice}
                voice={voice}
                events={candidate.voicing[voice]}
                approach={candidate.approach?.voices[voice]}
                activeUnit={activeUnit}
                gridUnits={gridUnits}
                checked={checkedVoices.includes(voice)}
                onCheckedChange={(checked) => onToggleVoice(voice, checked)}
                soloing={
                  playing && playback.voices.length === 1 && playback.voices[0] === voice
                }
                onPlayVoice={() => onPlayVoice(candidate.id, voice)}
                onStop={onStop}
                editingEventId={editingEventId}
                onEditNote={editNote}
                lockedEventIds={lockedEventIds}
                onToggleLock={(event) => onToggleNoteLock(candidate.id, event)}
                onStepNote={(eventId, direction) =>
                  onStepNote(candidate.id, voice, eventId, direction)
                }
                onInsertNote={(neighborEventId, side) => {
                  const newEventId = newUserEventId();
                  onInsertNote(candidate.id, voice, neighborEventId, side, newEventId);
                  setEditing({ candidateId: candidate.id, eventId: newEventId });
                }}
                onDeleteNote={(eventId) => {
                  onDeleteNote(candidate.id, voice, eventId);
                  if (editingEventId === eventId) setEditing(null);
                }}
                onResize={(eventId, edge, targetBoundary, ripple, gestureId) =>
                  onResizeNote(candidate.id, voice, eventId, edge, targetBoundary, ripple, gestureId)
                }
              />
            ))}
            <BoundaryThroughLines
              harmonyEvents={candidate.harmonyEvents}
              gridUnits={gridUnits}
            />
          </div>

          <div className={styles.lane}>
            <span className={styles.laneLabelStacked}>{content.inspector.chords}</span>
            {/* data-glossary-boundary: on mobile this wrapper clips x-overflow,
                so the numeral's glossary tip must flip inside it (Term.tsx). */}
            <div className={styles.laneTrackClip} data-glossary-boundary>
              <div className={styles.laneGrid}>
                <span className={styles.laneLabel}>
                  <span className={styles.laneLabelText}>{content.inspector.chords}</span>
                  {/* The chord the previous snippet ended on. */}
                  {candidate.approach?.harmony ? (
                    <span className={styles.approach}>
                      <span className={styles.approachStack}>
                        <span className={styles.approachSyllable}>
                          {candidate.approach.harmony.analysis.romanNumeral}
                        </span>
                        <span className={styles.approachPitch}>
                          {candidate.approach.harmony.displaySymbol}
                        </span>
                      </span>
                      <Icon name="east" className={styles.approachArrow} />
                    </span>
                  ) : null}
                </span>
                <ChordStrip
                  harmonyEvents={candidate.harmonyEvents}
                  activeUnit={activeUnit}
                  gridUnits={gridUnits}
                  computed={suggestionSource === 'computed'}
                />
              </div>
            </div>
            <div className={styles.laneControls} aria-hidden="true" />
          </div>

          {/* Mobile-only (CSS-gated): the sole way to move the note track. */}
          {needsPan(gridUnits) ? (
            <div className={styles.panRow}>
              <input
                type="range"
                className={styles.panSlider}
                min={0}
                max={100}
                value={Math.round(effectivePan * 100)}
                disabled={playing}
                aria-label={content.inspector.panLabel}
                title={playing ? content.inspector.panFollowing : content.inspector.panLabel}
                onChange={(changeEvent) => setPan(Number(changeEvent.target.value) / 100)}
              />
            </div>
          ) : null}

          <EffectSummary descriptors={candidate.descriptors} />

          <AnalysisDrawer
            candidate={candidate}
            fragment={fragment}
            open={drawerOpen}
            onToggle={() => setDrawerOpen((open) => !open)}
          />
        </div>
      )}
    </div>
  );
}
