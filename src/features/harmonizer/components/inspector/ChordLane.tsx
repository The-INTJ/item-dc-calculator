'use client';

import { content } from '../../content';
import type { HarmonyEvent } from '../../domain/music-types';
import { ChordStrip } from '../workspace/ChordStrip';
import { Icon } from '../shared/Icon';
import styles from './CandidateInspector.module.scss';

/**
 * The chord lane under the voice lanes: the reading's chord path on the
 * shared time grid, with the chord the previous snippet ended on shown the
 * same way a voice lane shows its approach note.
 */
export function ChordLane({
  harmonyEvents,
  approachHarmony,
  activeUnit,
  gridUnits,
  computed,
}: {
  harmonyEvents: HarmonyEvent[];
  /** The chord the previous snippet ended on. */
  approachHarmony: HarmonyEvent | null | undefined;
  activeUnit: number | null;
  gridUnits: number;
  computed: boolean;
}) {
  return (
    <div className={styles.lane}>
      <span className={styles.laneLabelStacked}>{content.inspector.chords}</span>
      {/* data-glossary-boundary: on mobile this wrapper clips x-overflow,
          so the numeral's glossary tip must flip inside it (Term.tsx). */}
      <div className={styles.laneTrackClip} data-glossary-boundary>
        <div className={styles.laneGrid}>
          <span className={styles.laneLabel}>
            <span className={styles.laneLabelText}>{content.inspector.chords}</span>
            {approachHarmony ? (
              <span className={styles.approach}>
                <span className={styles.approachStack}>
                  <span className={styles.approachSyllable}>
                    {approachHarmony.analysis.romanNumeral}
                  </span>
                  <span className={styles.approachPitch}>{approachHarmony.displaySymbol}</span>
                </span>
                <Icon name="east" className={styles.approachArrow} />
              </span>
            ) : null}
          </span>
          <ChordStrip
            harmonyEvents={harmonyEvents}
            activeUnit={activeUnit}
            gridUnits={gridUnits}
            computed={computed}
          />
        </div>
      </div>
      <div className={styles.laneControls} aria-hidden="true" />
    </div>
  );
}
