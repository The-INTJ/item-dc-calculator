'use client';

import { content } from '../../content';
import type { ApproachVoice } from '../../domain/approach';
import { pitchDisplay } from '../shared/format';
import { Icon } from '../shared/Icon';
import styles from './CandidateInspector.module.scss';

/**
 * The note this part is coming from, stacked solfège over pitch with an arrow
 * into the first note — the seam made visible (see domain/approach.ts).
 */
export function ApproachNote({
  approach,
  voiceLabel,
}: {
  approach: ApproachVoice;
  voiceLabel: string;
}) {
  return (
    <span
      className={styles.approach}
      title={`${voiceLabel} ${content.inspector.approachPrefix} ${approach.scaleDegree.syllable} ${pitchDisplay(approach.pitch)}`}
    >
      <span className={styles.approachStack}>
        <span className={styles.approachSyllable}>{approach.scaleDegree.syllable}</span>
        <span className={styles.approachPitch}>{pitchDisplay(approach.pitch)}</span>
      </span>
      <Icon name="east" className={styles.approachArrow} />
    </span>
  );
}
