import { content } from '../../content';
import type { PlaybackState, SuggestionStatus } from '../../domain/workbench-state';
import type { CandidatePathSummary } from '../../state/selectors';
import { EmptySuggestionsPanel } from '../suggestions/EmptySuggestionsPanel';
import { CandidateCard } from './CandidateCard';
import styles from './CandidatePalette.module.scss';

interface CandidatePaletteProps {
  summaries: CandidatePathSummary[];
  selectedCandidateId: string | null;
  suggestionStatus: SuggestionStatus;
  playback: PlaybackState;
  onSelect: (candidateId: string) => void;
  onPlayFull: (candidateId: string) => void;
  onStop: () => void;
  onRestoreSample: () => void;
  onChooseSample?: () => void;
}

export function CandidatePalette({
  summaries,
  selectedCandidateId,
  suggestionStatus,
  playback,
  onSelect,
  onPlayFull,
  onStop,
  onRestoreSample,
  onChooseSample,
}: CandidatePaletteProps) {
  if (suggestionStatus === 'empty') {
    return (
      <div>
        <div className={styles.headingRow}>
          <h2 className={styles.heading}>{content.regions.candidates}</h2>
        </div>
        <EmptySuggestionsPanel
          onRestoreSample={onRestoreSample}
          onChooseSample={onChooseSample}
        />
      </div>
    );
  }
  return (
    <div>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>{content.regions.candidates}</h2>
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
