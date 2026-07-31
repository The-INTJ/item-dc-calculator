'use client';

import { useEffect, useMemo, useState } from 'react';
import type { useMatchupVoting } from '../../../lib/hooks/useMatchupVoting';
import { VoteEntryChips } from './VoteEntryChips';
import { VoteEntryCard } from './VoteEntryCard';
import { VoteCategorySlider } from './VoteCategorySlider';
import { VoteSubmitBar } from './VoteSubmitBar';

interface VoteSheetBodyProps {
  voting: ReturnType<typeof useMatchupVoting>;
  matchupId: string;
  votingClosed: boolean;
}

/**
 * The scored content of the sheet: pick an entry, move its sliders, submit.
 * Owns which entry is showing — the modal above it only cares whether the
 * ballot landed.
 */
export function VoteSheetBody({ voting, matchupId, votingClosed }: VoteSheetBodyProps) {
  const { drinks, categories, scores, updateScore, submit, status, message, isSubmitting, selfEntryId } = voting;
  const [activeEntryIndex, setActiveEntryIndex] = useState(0);

  useEffect(() => {
    setActiveEntryIndex(0);
  }, [matchupId, drinks.length]);

  const activeEntry = drinks[activeEntryIndex] ?? drinks[0] ?? null;
  const isSelfEntry = activeEntry?.id === selfEntryId;
  const activeScores = activeEntry ? scores[activeEntry.id] ?? {} : {};

  const maxTotal = useMemo(
    () => categories.reduce((sum, category) => sum + (category.max ?? 10), 0),
    [categories],
  );
  const total = useMemo(() => {
    if (isSelfEntry) return maxTotal;
    return categories.reduce((sum, category) => sum + (activeScores[category.id] ?? category.min ?? 0), 0);
  }, [activeScores, categories, isSelfEntry, maxTotal]);

  if (drinks.length === 0 || categories.length === 0 || !activeEntry) {
    return (
      <div className="vote-sheet__empty">
        {drinks.length === 0 ? 'No entries assigned to this matchup yet.' : 'No scoring categories yet.'}
      </div>
    );
  }

  const canSubmit = !isSubmitting && !votingClosed;
  const isLastEntry = activeEntryIndex >= drinks.length - 1;

  const handlePrimaryAction = () => {
    if (!isLastEntry) {
      setActiveEntryIndex((index) => Math.min(index + 1, drinks.length - 1));
      return;
    }
    void submit();
  };

  return (
    <>
      <VoteEntryChips entries={drinks} activeIndex={activeEntryIndex} onSelect={setActiveEntryIndex} />
      <VoteEntryCard entry={activeEntry} isSelfEntry={isSelfEntry} />

      {isSelfEntry && (
        <p className="vote-sheet__self-notice">
          You can&apos;t score your own entry — it auto-records the maximum.
        </p>
      )}

      {votingClosed && (
        <p className="vote-sheet__closed-banner" role="status">
          {status === 'closed' && message
            ? message
            : 'Voting just closed for this matchup — scores can no longer be submitted.'}
        </p>
      )}

      <div className="vote-sheet__scores">
        {categories.map((category) => (
          <VoteCategorySlider
            key={category.id}
            category={category}
            entryId={activeEntry.id}
            value={isSelfEntry ? category.max ?? 10 : activeScores[category.id] ?? category.min ?? 0}
            disabled={isSelfEntry || votingClosed}
            onChange={(value) => updateScore(activeEntry.id, category.id, value)}
          />
        ))}
      </div>

      {message && status !== 'closed' && (
        <p className={`contest-vote-actions__message contest-vote-actions__message--${status}`}>
          {message}
        </p>
      )}

      <VoteSubmitBar
        total={total}
        maxTotal={maxTotal}
        label={isSubmitting ? 'Submitting...' : isLastEntry ? 'Submit scores' : 'Next entry'}
        disabled={!canSubmit || status === 'success'}
        onAction={handlePrimaryAction}
      />
    </>
  );
}
