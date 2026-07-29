import { content } from '../../content';
import type { PlaybackState } from '../../domain/workbench-state';
import type { CandidatePathSummary } from '../../state/selectors';
import { CandidateCard } from './CandidateCard';
import styles from './CandidatePalette.module.scss';

interface CandidatePaletteProps {
  summaries: CandidatePathSummary[];
  selectedCandidateId: string | null;
  playback: PlaybackState;
  onSelect: (candidateId: string) => void;
  onPlayFull: (candidateId: string) => void;
  onStop: () => void;
}

export function CandidatePalette({
  summaries,
  selectedCandidateId,
  playback,
  onSelect,
  onPlayFull,
  onStop,
}: CandidatePaletteProps) {
  return (
    <div>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>{content.regions.candidates}</h2>
        <button type="button" className={styles.refresh} disabled title={content.comingSoon}>
          {content.candidates.refresh}
        </button>
      </div>
      <div className={styles.grid}>
        {summaries.map((summary, index) => (
          <CandidateCard
            key={summary.id}
            summary={summary}
            letter={String.fromCharCode(65 + index)}
            selected={summary.id === selectedCandidateId}
            playing={playback.status === 'playing' && playback.candidateId === summary.id}
            onSelect={() => onSelect(summary.id)}
            onPlayFull={() => onPlayFull(summary.id)}
            onStop={onStop}
          />
        ))}
      </div>
    </div>
  );
}
