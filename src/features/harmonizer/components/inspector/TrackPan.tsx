'use client';

import { useState } from 'react';
import { content } from '../../content';
import { needsPan, panForUnit, panShiftPercent, trackScale } from '../shared/pan';
import styles from './CandidateInspector.module.scss';

/**
 * Mobile note panning, measured in beats: the window holds the default
 * fragment's one measure and anything longer slides. Every lane and the
 * chord strip share the scale, so they pan in lockstep. While playing, the
 * pan is derived from the cursor so the view follows the music; when
 * playback stops `activeUnit` goes null and the slider's own position takes
 * over again.
 */
export function useTrackPan(gridUnits: number, activeUnit: number | null) {
  /** 0–1 slider position for the mobile note track (see shared/pan.ts). */
  const [pan, setPan] = useState(0);
  const scale = trackScale(gridUnits);
  const effectivePan = activeUnit !== null ? panForUnit(activeUnit, gridUnits, scale) : pan;
  const panVars = {
    '--wb-time-units': gridUnits,
    '--wb-track-scale': scale,
    '--wb-pan-shift': panShiftPercent(effectivePan, scale),
    '--wb-pan-shadow-left': scale > 1 && effectivePan > 0.002 ? 1 : 0,
    '--wb-pan-shadow-right': scale > 1 && effectivePan < 0.998 ? 1 : 0,
  };
  return { effectivePan, setPan, panVars };
}

/** Mobile-only (CSS-gated): the sole way to move the note track. */
export function PanSlider({
  gridUnits,
  effectivePan,
  playing,
  onPan,
}: {
  gridUnits: number;
  effectivePan: number;
  playing: boolean;
  onPan: (pan: number) => void;
}) {
  if (!needsPan(gridUnits)) return null;
  return (
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
        onChange={(changeEvent) => onPan(Number(changeEvent.target.value) / 100)}
      />
    </div>
  );
}
