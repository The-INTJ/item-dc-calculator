'use client';

import { content } from '../../content';
import { MasterTransport } from './MasterTransport';
import styles from './CandidateInspector.module.scss';

interface InspectorHeadingProps {
  hasCandidate: boolean;
  playing: boolean;
  playDisabled: boolean;
  onPlay: () => void;
  onStop: () => void;
}

/**
 * Just the region name and, in line with it, the transport — the reading's own
 * name lives below with the analysis, not up here.
 */
export function InspectorHeading({
  hasCandidate,
  playing,
  playDisabled,
  onPlay,
  onStop,
}: InspectorHeadingProps) {
  return (
    <div className={styles.headingRow}>
      <h2 className={styles.heading}>{content.regions.inspector}</h2>
      {hasCandidate ? (
        <MasterTransport
          playing={playing}
          disabled={playDisabled}
          onPlay={onPlay}
          onStop={onStop}
        />
      ) : null}
    </div>
  );
}
