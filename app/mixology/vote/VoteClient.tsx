'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/src/mixology/auth';
import type { UserVote } from '@/src/mixology/auth/types';
import { useMixologyData } from '@/src/mixology/data/MixologyDataContext';
import { RoundCard, VoteScorePanel } from '@/src/mixology/ui';
import type { ScoreBreakdown, ScoreEntry } from '@/src/mixology/types';
import { buildTotalsFromScores } from '@/src/mixology/ui/voteUtils';

const breakdownKeys: Array<keyof ScoreBreakdown> = [
  'aroma',
  'balance',
  'presentation',
  'creativity',
  'overall',
];

const breakdownKeySet = new Set<string>(breakdownKeys);

function isBreakdownKey(value: string): value is keyof ScoreBreakdown {
  return breakdownKeySet.has(value);
}

function buildScoreDefaults(
  drinkIds: string[],
  categoryIds: string[],
  defaultValue = 5
): Record<string, Record<string, number>> {
  return drinkIds.reduce<Record<string, Record<string, number>>>((acc, drinkId) => {
    acc[drinkId] = categoryIds.reduce<Record<string, number>>((categoriesAcc, categoryId) => {
      categoriesAcc[categoryId] = defaultValue;
      return categoriesAcc;
    }, {});
    return acc;
  }, {});
}

function mergeScoreMaps(
  base: Record<string, Record<string, number>>,
  overrides: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const merged: Record<string, Record<string, number>> = { ...base };
  Object.entries(overrides).forEach(([drinkId, scores]) => {
    merged[drinkId] = { ...(merged[drinkId] ?? {}), ...scores };
  });
  return merged;
}

function buildScoresFromEntries(entries: ScoreEntry[], categoryIds: string[]) {
  return entries.reduce<Record<string, Record<string, number>>>((acc, entry) => {
    categoryIds.forEach((categoryId) => {
      if (!isBreakdownKey(categoryId)) return;
      const value = entry.breakdown[categoryId];
      if (!Number.isFinite(value)) return;
      acc[entry.drinkId] = acc[entry.drinkId] ?? {};
      acc[entry.drinkId][categoryId] = value;
    });
    return acc;
  }, {});
}

function buildScoresFromVotes(votes: UserVote[], categoryIds: string[]) {
  return votes.reduce<Record<string, Record<string, number>>>((acc, vote) => {
    categoryIds.forEach((categoryId) => {
      if (!isBreakdownKey(categoryId)) return;
      const value = vote.breakdown?.[categoryId];
      if (typeof value !== 'number' || !Number.isFinite(value)) return;
      acc[vote.drinkId] = acc[vote.drinkId] ?? {};
      acc[vote.drinkId][categoryId] = value;
    });
    return acc;
  }, {});
}

function buildFullBreakdown(values: Partial<ScoreBreakdown>): ScoreBreakdown {
  return breakdownKeys.reduce<ScoreBreakdown>((acc, key) => {
    acc[key] = values[key] ?? 0;
    return acc;
  }, {} as ScoreBreakdown);
}

function calculateScore(breakdown: ScoreBreakdown): number {
  const scores = breakdownKeys.map((key) => breakdown[key]).filter((value) => Number.isFinite(value));
  if (breakdown.overall > 0) return breakdown.overall;
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function VoteHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="mixology-hero">
      <h1>Cast your votes</h1>
      <p>Review each drink and score every category with the sliders below.</p>
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
  const { session, role, recordVote } = useAuth();
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
  const [draftScores, setDraftScores] = useState<Record<string, Record<string, number>>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const hasLoadedRemoteScores = useRef(false);

  const judgeId = session?.firebaseUid ?? session?.sessionId;
  const categoryIds = useMemo(() => categories.map((category) => category.id), [categories]);

  useEffect(() => {
    if (!contest?.id) {
      hasLoadedRemoteScores.current = false;
      return;
    }
    hasLoadedRemoteScores.current = false;
  }, [contest?.id, judgeId]);

  useEffect(() => {
    if (drinks.length === 0 || categoryIds.length === 0) {
      setDraftScores({});
      return;
    }

    const defaults = buildScoreDefaults(
      drinks.map((drink) => drink.id),
      categoryIds
    );
    setDraftScores((prev) => mergeScoreMaps(defaults, prev));
  }, [categoryIds, drinks]);

  useEffect(() => {
    if (!contest?.id || !judgeId || categoryIds.length === 0) return;

    const localVotes = session?.votes?.filter((vote) => vote.contestId === contest.id) ?? [];
    if (localVotes.length > 0) {
      const mapped = buildScoresFromVotes(localVotes, categoryIds);
      setDraftScores((prev) => mergeScoreMaps(prev, mapped));
    }
  }, [categoryIds, contest?.id, judgeId, session?.votes]);

  useEffect(() => {
    if (!contest?.id || !judgeId || categoryIds.length === 0 || hasLoadedRemoteScores.current) return;

    let isActive = true;

    const loadRemoteScores = async () => {
      try {
        const response = await fetch(
          `/api/mixology/contests/${contest.id}/scores?judgeId=${encodeURIComponent(judgeId)}`
        );
        if (!response.ok) return;
        const payload = (await response.json()) as { scores?: ScoreEntry[] };
        if (!isActive) return;
        const mapped = buildScoresFromEntries(payload.scores ?? [], categoryIds);
        setDraftScores((prev) => mergeScoreMaps(prev, mapped));
        hasLoadedRemoteScores.current = true;
      } catch {
        if (isActive) {
          hasLoadedRemoteScores.current = true;
        }
      }
    };

    void loadRemoteScores();

    return () => {
      isActive = false;
    };
  }, [categoryIds, contest?.id, judgeId]);

  const canSubmit = Boolean(drinks.length > 0 && categoryIds.length > 0);

  const handleScoreChange = useCallback(
    (drinkId: string, categoryId: string, value: number) => {
      setDraftScores((prev) => ({
        ...prev,
        [drinkId]: {
          ...(prev[drinkId] ?? {}),
          [categoryId]: value,
        },
      }));
    },
    []
  );

  const handleSubmitScores = useCallback(async () => {
    if (!contest?.id || !judgeId) {
      return;
    }

    const entries = Object.entries(draftScores)
      .map(([drinkId, scores]) => {
        const breakdown = categoryIds.reduce<Partial<ScoreBreakdown>>((acc, categoryId) => {
          if (!isBreakdownKey(categoryId)) return acc;
          const value = scores?.[categoryId];
          if (!Number.isFinite(value)) return acc;
          acc[categoryId] = value;
          return acc;
        }, {});
        return { drinkId, breakdown };
      })
      .filter((entry) => Object.keys(entry.breakdown).length > 0);

    if (entries.length === 0) {
      setSubmitStatus('error');
      setSubmitMessage('Enter at least one score before submitting.');
      return;
    }

    setSubmitStatus('submitting');
    setSubmitMessage(null);

    try {
      const responses = await Promise.all(
        entries.map(({ drinkId, breakdown }) =>
          fetch(`/api/mixology/contests/${contest.id}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              drinkId,
              judgeId,
              judgeName: session?.profile.displayName ?? 'Guest',
              judgeRole: role ?? 'judge',
              breakdown,
            }),
          })
        )
      );

      const failed = responses.find((res) => !res.ok);
      if (failed) {
        const payload = await failed.json().catch(() => ({}));
        throw new Error(payload.message ?? 'Failed to submit scores.');
      }

      for (const entry of entries) {
        const fullBreakdown = buildFullBreakdown(entry.breakdown);
        await recordVote({
          contestId: contest.id,
          drinkId: entry.drinkId,
          breakdown: fullBreakdown,
          score: calculateScore(fullBreakdown),
        });
      }
      setSubmitStatus('success');
      setSubmitMessage('Scores submitted and saved to your session.');
      await refreshAll();
    } catch (submitError) {
      setSubmitStatus('error');
      setSubmitMessage(String(submitError));
    }
  }, [categoryIds, contest?.id, draftScores, judgeId, recordVote, refreshAll, role, session?.profile.displayName]);

  return (
    <div className="mixology-landing">
      <VoteHeader onRefresh={() => void refreshAll()} />

      {loading && !roundSummary && <div className="mixology-card">Loading current round...</div>}
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
        <VoteScorePanel
          drinks={drinks}
          categories={categories}
          totals={totals}
          scoreByDrinkId={draftScores}
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
