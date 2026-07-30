'use client';

import { content } from '../../content';
import type { PhraseIntent } from '../../domain/music-types';
import type { PlaybackState, SuggestionStatus } from '../../domain/workbench-state';
import { plainTextFromMarked } from '../../knowledge/markup/parse';
import type { CandidatePathSummary } from '../../state/selectors';
import { useDevFlag } from '../shared/useDevFlag';
import { EmptySuggestionsPanel } from '../suggestions/EmptySuggestionsPanel';
import { CandidateCard } from './CandidateCard';
import styles from './CandidatePalette.module.scss';

interface CandidatePaletteProps {
  summaries: CandidatePathSummary[];
  selectedCandidateId: string | null;
  suggestionStatus: SuggestionStatus;
  playback: PlaybackState;
  phraseIntent: PhraseIntent;
  onIntentChange: (intent: PhraseIntent) => void;
  onSelect: (candidateId: string) => void;
  onPlayFull: (candidateId: string) => void;
  onStop: () => void;
  onRestoreSample: () => void;
  onChooseSample?: () => void;
}

const PHRASE_INTENTS: PhraseIntent[] = ['continue', 'build', 'approach_cadence', 'close'];

/**
 * Phrase intent asks what this stretch of hymn should DO, so it belongs with
 * the readings it steers rather than in the settings bar (Drew, 2026-07-30).
 * It carries forward from the previous fragment — 'continue' on a fresh piece.
 */
function PhraseIntentControl({
  phraseIntent,
  onIntentChange,
}: {
  phraseIntent: PhraseIntent;
  onIntentChange: (intent: PhraseIntent) => void;
}) {
  return (
    <div className={styles.intent}>
      <span className={styles.intentQuestion} id="wb-intent-question">
        {content.phraseIntent.question}
      </span>
      <select
        className={styles.intentSelect}
        aria-labelledby="wb-intent-question"
        value={phraseIntent}
        // Attribute surface — glossary markup renders as its plain text here.
        title={plainTextFromMarked(content.phraseIntent.descriptions[phraseIntent])}
        onChange={(event) => onIntentChange(event.target.value as PhraseIntent)}
      >
        {PHRASE_INTENTS.map((intent) => (
          <option key={intent} value={intent}>
            {content.phraseIntent.options[intent]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CandidatePalette({
  summaries,
  selectedCandidateId,
  suggestionStatus,
  playback,
  phraseIntent,
  onIntentChange,
  onSelect,
  onPlayFull,
  onStop,
  onRestoreSample,
  onChooseSample,
}: CandidatePaletteProps) {
  const dev = useDevFlag();
  const heading = (
    <div className={styles.headingRow}>
      <h2 className={styles.heading}>{content.regions.candidates}</h2>
      <PhraseIntentControl phraseIntent={phraseIntent} onIntentChange={onIntentChange} />
    </div>
  );

  if (suggestionStatus === 'empty') {
    return (
      <div>
        {heading}
        <EmptySuggestionsPanel
          onRestoreSample={onRestoreSample}
          onChooseSample={onChooseSample}
        />
      </div>
    );
  }
  return (
    <div>
      {heading}
      <div className={styles.grid}>
        {summaries.map((summary, index) => (
          <CandidateCard
            key={summary.id}
            summary={summary}
            letter={String.fromCharCode(65 + index)}
            selected={summary.id === selectedCandidateId}
            current={summary.id === selectedCandidateId}
            playing={playback.status === 'playing' && playback.candidateId === summary.id}
            showProvenance={dev}
            onSelect={() => onSelect(summary.id)}
            onPlayFull={() => onPlayFull(summary.id)}
            onStop={onStop}
          />
        ))}
      </div>
    </div>
  );
}
