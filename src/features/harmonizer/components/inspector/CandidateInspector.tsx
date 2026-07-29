'use client';

import { useState } from 'react';
import { content } from '../../content';
import type { CandidatePath } from '../../domain/analysis-types';
import type { BoundaryConstraint, MelodyFragment, VoiceId } from '../../domain/music-types';
import { totalUnits, toTimelineSpan } from '../../domain/timing';
import type { PlaybackState } from '../../domain/workbench-state';
import { classes } from '../shared/format';
import { HarmonyEventBlock } from '../shared/HarmonyEventBlock';
import { cssVars, isUnitActive } from '../shared/timeGrid';
import { AnalysisDrawer } from './AnalysisDrawer';
import { BoundaryRow } from './BoundaryRow';
import { EffectSummary } from './EffectSummary';
import { VoiceLane } from './VoiceLane';
import styles from './CandidateInspector.module.scss';

interface CandidateInspectorProps {
  candidate: CandidatePath | null;
  candidateLetter: string | null;
  fragment: MelodyFragment;
  boundaryConstraints: BoundaryConstraint[];
  playback: PlaybackState;
  loopEnabled: boolean;
  checkedVoices: VoiceId[];
  onToggleVoice: (voice: VoiceId, checked: boolean) => void;
  onPlayChecked: () => void;
  onPlayVoice: (candidateId: string, voice: VoiceId) => void;
  onStop: () => void;
  onToggleLoop: () => void;
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
  candidateLetter,
  fragment,
  boundaryConstraints,
  playback,
  loopEnabled,
  checkedVoices,
  onToggleVoice,
  onPlayChecked,
  onPlayVoice,
  onStop,
  onToggleLoop,
}: CandidateInspectorProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const playing = playback.status === 'playing';
  const activeUnit = playing ? playback.activeUnit : null;

  return (
    <div>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>
          {content.regions.inspector}
          {candidate ? (
            <span className={styles.headingTitle}>
              {candidateLetter ? `${candidateLetter} — ` : ''}
              {candidate.title}
            </span>
          ) : null}
        </h2>
        <button type="button" className={styles.apply} disabled title={content.comingSoon}>
          {content.inspector.apply}
        </button>
      </div>

      {!candidate ? (
        <p className={styles.noSelection}>{content.inspector.noSelection}</p>
      ) : (
        <div
          className={styles.lanes}
          style={cssVars({
            '--wb-time-units': totalUnits(fragment),
            '--wb-lane-label-width': '6.5rem',
          })}
        >
          <div className={styles.masterRow}>
            {playing ? (
              <button type="button" className={styles.masterButton} onClick={onStop}>
                ■ {content.inspector.stop}
              </button>
            ) : (
              <button
                type="button"
                className={styles.masterButton}
                onClick={onPlayChecked}
                disabled={checkedVoices.length === 0}
              >
                ▶ {content.inspector.play}
              </button>
            )}
            <button
              type="button"
              className={classes(styles.loopButton, loopEnabled && styles.loopActive)}
              aria-pressed={loopEnabled}
              onClick={onToggleLoop}
            >
              {content.inspector.loop}
            </button>
            <button type="button" className={styles.addNote} disabled title={content.comingSoon}>
              + {content.melody.addNote}
            </button>
          </div>

          {VOICES.map((voice) => (
            <VoiceLane
              key={voice}
              voice={voice}
              events={candidate.voicing[voice]}
              locked={voice === 'soprano'}
              activeUnit={activeUnit}
              checked={checkedVoices.includes(voice)}
              onCheckedChange={(checked) => onToggleVoice(voice, checked)}
              soloing={
                playing &&
                playback.candidateId === candidate.id &&
                playback.voices.length === 1 &&
                playback.voices[0] === voice
              }
              onPlayVoice={() => onPlayVoice(candidate.id, voice)}
              onStop={onStop}
            />
          ))}

          <BoundaryRow fragment={fragment} boundaryConstraints={boundaryConstraints} />

          <div className={styles.lane}>
            <div className={styles.laneGrid}>
              <span className={styles.laneLabel}>{content.inspector.chords}</span>
              {candidate.harmonyEvents.map((event) => (
                <HarmonyEventBlock
                  key={event.id}
                  event={event}
                  active={isUnitActive(toTimelineSpan(event.start, event.duration), activeUnit)}
                />
              ))}
            </div>
            <div className={styles.laneControls} aria-hidden="true" />
          </div>

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
