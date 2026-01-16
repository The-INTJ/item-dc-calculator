'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMixologyData } from '@/src/mixology/data/MixologyDataContext';
import { RoundCard, VoteCategoryTabs, VoteScorePanel } from '@/src/mixology/ui';
import { buildDefaultVoteCategories, buildTotalsFromScores } from '@/src/mixology/ui/voteUtils';

function VoteHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="mixology-hero">
      <h1>Cast your votes</h1>
      <p>Review each drink and submit scores by category.</p>
      <div className="mixology-actions">
        <button type="button" className="button-secondary" onClick={onRefresh}>
          Refresh round
        </button>
      </div>
    </section>
  );
}

function VoteSummary({ roundName, drinkCount }: { roundName: string; drinkCount: number }) {
  return (
    <div className="mixology-card">
      <h2>{roundName}</h2>
      <p>{drinkCount} drinks in this round.</p>
    </div>
  );
}

export function VoteClient() {
  const { contest, roundSummary, drinks, loading, error, refreshAll } = useMixologyData();
  const categories = useMemo(() => buildDefaultVoteCategories(), []);
  const totals = useMemo(
    () => buildTotalsFromScores(contest?.scores ?? [], categories),
    [contest?.scores, categories]
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [activeCategoryId, categories]);

  const activeCategoryLabel = categories.find((category) => category.id === activeCategoryId)?.label;
  const scoreByDrinkId = activeCategoryId ? draftScores[activeCategoryId] : undefined;

  const handleScoreChange = useCallback(
    (drinkId: string, value: number) => {
      if (!activeCategoryId) return;
      setDraftScores((prev) => ({
        ...prev,
        [activeCategoryId]: {
          ...(prev[activeCategoryId] ?? {}),
          [drinkId]: value,
        },
      }));
    },
    [activeCategoryId]
  );

  return (
    <div className="mixology-landing">
      <VoteHeader onRefresh={() => void refreshAll()} />

      {loading && !roundSummary && <div className="mixology-card">Loading round details...</div>}
      {error && <div className="mixology-card">Error loading round data: {error}</div>}

      <section className="mixology-panels">
        {roundSummary ? (
          <RoundCard round={roundSummary} variant="detailed" />
        ) : (
          <div className="mixology-card">
            <h2>No active round</h2>
            <p>Please check back when the contest is active.</p>
          </div>
        )}
        <VoteSummary roundName={roundSummary?.name ?? 'Current round'} drinkCount={drinks.length} />
      </section>

      <section className="mixology-vote-layout">
        <VoteCategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onChange={setActiveCategoryId}
        />
        <VoteScorePanel
          drinks={drinks}
          totals={totals}
          activeCategoryId={activeCategoryId}
          activeCategoryLabel={activeCategoryLabel}
          scoreByDrinkId={scoreByDrinkId}
          onScoreChange={handleScoreChange}
        />
      </section>
    </div>
  );
}
