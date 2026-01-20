'use client';

import { useMemo } from 'react';
import { useMixologyData } from '@/src/mixology/data/MixologyDataContext';
import { VoteScorePanel } from '@/src/mixology/ui';
import { buildTotalsFromScores } from '@/src/mixology/ui/voteUtils';
import { useVoteScores, useSubmitVotes } from './hooks';
import { VotePageHeader, VoteActions } from './components';

export function VotePage() {
  const { contest, drinks, loading, error } = useMixologyData();

  const categories = useMemo(
    () =>
      (contest?.categories ?? [])
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [contest?.categories]
  );

  const totals = useMemo(
    () => buildTotalsFromScores(contest?.scores ?? [], categories),
    [contest?.scores, categories]
  );

  const { scores, updateScore } = useVoteScores();
  const { status, message, submitScores, isSubmitting } = useSubmitVotes();

  const canSubmit = drinks.length > 0 && categories.length > 0;

  const handleSubmit = () => {
    void submitScores(scores);
  };

  if (loading) {
    return (
      <div className="mixology-vote-page">
        <VotePageHeader />
        <div className="mixology-card">Loading drinks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mixology-vote-page">
        <VotePageHeader />
        <div className="mixology-card">Error: {error}</div>
      </div>
    );
  }

  if (drinks.length === 0) {
    return (
      <div className="mixology-vote-page">
        <VotePageHeader />
        <div className="mixology-card">
          <p>No drinks available for voting yet. Please check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mixology-vote-page">
      <VotePageHeader />

      <VoteScorePanel
        drinks={drinks}
        categories={categories}
        totals={totals}
        scoreByDrinkId={scores}
        onScoreChange={updateScore}
      />

      <VoteActions
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        status={status}
        message={message}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
