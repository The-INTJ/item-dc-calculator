'use client';

import { useContestDetails } from '@/contest/contexts/ContestDataContext';
import { useRoundState } from '@/src/features/contest/contexts/RoundStateContext';
import { VoteScorePanel } from '@/contest/components/ui/VoteScorePanel';
import { buildTotalsFromScores } from '@/contest/components/ui/voteUtils';
import { useVoteScores } from '@/contest/lib/hooks/useVoteScores';
import { useSubmitVotes } from '@/contest/lib/hooks/useSubmitVotes';
import { VotePageHeader } from '@/contest/components/votePage/VotePageHeader';
import { VoteActions } from '@/contest/components/votePage/VoteActions';

export function VotePage() {
  const { contest, drinks, loading, error } = useContestDetails();
  const { state: contestState } = useRoundState();

  const categories = contest?.config?.attributes ?? [];

  const totals = buildTotalsFromScores(contest?.scores ?? [], categories);

  const { scores, updateScore } = useVoteScores();
  const { status, message, submitScores, isSubmitting } = useSubmitVotes();

  // Voting is only allowed when state is 'shake'
  const isVotingOpen = contestState === 'shake';
  const isScored = contestState === 'scored';
  const canSubmit = isVotingOpen && drinks.length > 0 && categories.length > 0;

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

  // States where voting isn't available yet (debug, set)
  if (contestState === 'set') {
    return (
      <div className="mixology-vote-page">
        <VotePageHeader />
        <div className="mixology-card mixology-card--info">
          <p>
            <strong>Voting hasn&apos;t started yet.</strong>
          </p>
          <p>
            The contest is currently in <strong>{'Set'}</strong> mode.
            Voting will open once the admin starts the <strong>Shake</strong> phase.
          </p>
        </div>
      </div>
    );
  }

  if (drinks.length === 0) {
    return (
      <div className="mixology-vote-page">
        <VotePageHeader />
        <div className="mixology-card">
          <p>No drinks available for voting in this round. Please check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mixology-vote-page">
      <VotePageHeader />

      {isScored && (
        <div className="mixology-card mixology-card--warning">
          <p>
            <strong>Voting is closed.</strong>
          </p>
          <p>
            This round has been scored. If you need to log or change a score,
            ask the admin to switch back to <strong>Shake</strong> mode.
          </p>
        </div>
      )}

      <div className={isScored ? 'vote-panel--disabled' : ''}>
        <VoteScorePanel
          drinks={drinks}
          categories={categories}
          totals={totals}
          scoreByDrinkId={scores}
          onScoreChange={isVotingOpen ? updateScore : undefined}
          disabled={!isVotingOpen}
        />
      </div>

      {isVotingOpen && (
        <VoteActions
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          status={status}
          message={message}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
