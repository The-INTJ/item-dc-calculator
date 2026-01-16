'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/mixology/auth';
import { useMixologyData } from '@/src/mixology/data/MixologyDataContext';
import { RoundCard, VoteCategoryTabs, VoteScorePanel } from '@/src/mixology/ui';
import { buildTotalsFromScores } from '@/src/mixology/ui/voteUtils';

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
  const { session, role } = useAuth();
  const { contest, roundSummary, drinks, loading, error, refreshAll } = useMixologyData();
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
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, Record<string, number>>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategoryId(null);
      return;
    }

    if (!activeCategoryId || !categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [activeCategoryId, categories]);

  const activeCategoryLabel = categories.find((category) => category.id === activeCategoryId)?.label;
  const scoreByDrinkId = activeCategoryId ? draftScores[activeCategoryId] : undefined;
  const canSubmit = Boolean(
    activeCategoryId &&
      scoreByDrinkId &&
      Object.values(scoreByDrinkId).some((value) => Number.isFinite(value))
  );

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

  const handleSubmitScores = useCallback(async () => {
    if (!contest?.id || !activeCategoryId) {
      return;
    }

    const judgeId = session?.firebaseUid ?? session?.sessionId;
    if (!judgeId) {
      setSubmitStatus('error');
      setSubmitMessage('Unable to identify your session. Please refresh and try again.');
      return;
    }

    const scores = scoreByDrinkId ?? {};
    const entries = Object.entries(scores).filter(([, value]) => Number.isFinite(value));

    if (entries.length === 0) {
      setSubmitStatus('error');
      setSubmitMessage('Enter at least one score before submitting.');
      return;
    }

    setSubmitStatus('submitting');
    setSubmitMessage(null);

    try {
      const responses = await Promise.all(
        entries.map(([drinkId, value]) =>
          fetch(`/api/mixology/contests/${contest.id}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              drinkId,
              judgeId,
              judgeName: session?.profile.displayName ?? 'Guest',
              judgeRole: role ?? 'judge',
              categoryId: activeCategoryId,
              value,
            }),
          })
        )
      );

      const failed = responses.find((res) => !res.ok);
      if (failed) {
        const payload = await failed.json().catch(() => ({}));
        throw new Error(payload.message ?? 'Failed to submit scores.');
      }

      setDraftScores((prev) => ({
        ...prev,
        [activeCategoryId]: {},
      }));
      setSubmitStatus('success');
      setSubmitMessage('Scores submitted.');
      await refreshAll();
    } catch (submitError) {
      setSubmitStatus('error');
      setSubmitMessage(String(submitError));
    }
  }, [activeCategoryId, contest?.id, refreshAll, role, scoreByDrinkId, session]);

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
        <div className="mixology-vote-actions">
          <button
            type="button"
            className="button-primary"
            onClick={handleSubmitScores}
            disabled={!canSubmit || submitStatus === 'submitting'}
          >
            {submitStatus === 'submitting' ? 'Submitting...' : 'Submit scores'}
          </button>
          {submitMessage && (
            <p className={`mixology-vote-actions__message mixology-vote-actions__message--${submitStatus}`}>
              {submitMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
