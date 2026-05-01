'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, Slider, useMediaQuery, useTheme } from '@mui/material';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';
import { getRoundLabel } from '../../lib/domain/contestGetters';
import { useMatchupVoting } from '../../lib/hooks/useMatchupVoting';

interface VoteModalProps {
  open: boolean;
  onClose: () => void;
  contest: Contest;
  matchup: Matchup;
}

export function VoteModal({ open, onClose, contest, matchup }: VoteModalProps) {
  const roundName = getRoundLabel(contest, matchup.roundId);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    drinks,
    categories,
    scores,
    updateScore,
    submit,
    status,
    message,
    isSubmitting,
    selfEntryId,
  } = useMatchupVoting(contest, matchup);
  const [activeEntryIndex, setActiveEntryIndex] = useState(0);

  useEffect(() => {
    setActiveEntryIndex(0);
  }, [matchup.id, drinks.length]);

  useEffect(() => {
    if (!open || status !== 'success') return;
    const timer = setTimeout(onClose, 1500);
    return () => clearTimeout(timer);
  }, [open, status, onClose]);

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

  const canSubmit = drinks.length > 0 && categories.length > 0 && !isSubmitting;
  const isLastEntry = activeEntryIndex >= drinks.length - 1;

  const handlePrimaryAction = () => {
    if (!isLastEntry) {
      setActiveEntryIndex((index) => Math.min(index + 1, drinks.length - 1));
      return;
    }

    void submit();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="vote-sheet"
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      aria-labelledby="vote-sheet-title"
      slotProps={{
        paper: { className: 'vote-sheet__paper' },
        backdrop: { className: 'vote-sheet__backdrop' },
      }}
    >
      <div className="vote-sheet__grabber" aria-hidden="true" />
      <header className="vote-sheet__header">
        <div>
          <p className="eyebrow vote-sheet__eyebrow">{roundName} / Live</p>
          <h2 id="vote-sheet-title">Score entries</h2>
        </div>
        <button type="button" className="vote-sheet__close" onClick={onClose} aria-label="Close">
          X
        </button>
      </header>

      {drinks.length === 0 || categories.length === 0 || !activeEntry ? (
        <div className="vote-sheet__empty">
          {drinks.length === 0 ? 'No entries assigned to this matchup yet.' : 'No scoring categories yet.'}
        </div>
      ) : (
        <>
          <nav className="vote-sheet__entry-chips" aria-label="Entries">
            {drinks.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                className={`vote-sheet__entry-chip${index === activeEntryIndex ? ' vote-sheet__entry-chip--active' : ''}`}
                onClick={() => setActiveEntryIndex(index)}
              >
                {index + 1}. {entry.name ?? 'Unnamed entry'}
              </button>
            ))}
          </nav>

          <section className="vote-sheet__entry-card">
            <span className="vote-sheet__entry-art" aria-hidden="true" />
            <span className="vote-sheet__entry-copy">
              <strong>{activeEntry.name ?? 'Unnamed entry'}</strong>
              <span>
                by {activeEntry.creatorName}
                {isSelfEntry && <em className="vote-sheet__self-badge"> · Your entry</em>}
              </span>
            </span>
          </section>

          {isSelfEntry && (
            <p className="vote-sheet__self-notice">
              You can't score your own entry — it auto-records the maximum.
            </p>
          )}

          <div className="vote-sheet__scores">
            {categories.map((category) => {
              const min = category.min ?? 0;
              const max = category.max ?? 10;
              const value = isSelfEntry ? max : activeScores[category.id] ?? min;
              return (
                <div key={category.id} className="contest-vote-slider">
                  <div className="contest-vote-slider__label-row">
                    <label className="contest-vote-slider__label" htmlFor={`score-${activeEntry.id}-${category.id}`}>
                      {category.label}
                    </label>
                    <span className="contest-vote-slider__value">
                      {value}
                      <span> / {max}</span>
                    </span>
                  </div>
                  <Slider
                    id={`score-${activeEntry.id}-${category.id}`}
                    className="contest-vote-slider__field"
                    min={min}
                    max={max}
                    step={1}
                    value={value}
                    valueLabelDisplay="auto"
                    disabled={isSelfEntry}
                    onChange={(_, nextValue) => {
                      if (isSelfEntry) return;
                      const normalized = Array.isArray(nextValue) ? nextValue[0] : nextValue;
                      updateScore(activeEntry.id, category.id, normalized);
                    }}
                  />
                  <div className="contest-vote-slider__scale" aria-hidden="true">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>
              );
            })}
          </div>

          {message && (
            <p className={`contest-vote-actions__message contest-vote-actions__message--${status}`}>
              {message}
            </p>
          )}

          <footer className="vote-sheet__submit-bar">
            <div>
              <span>Total</span>
              <strong>
                {total}
                <small> / {maxTotal}</small>
              </strong>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handlePrimaryAction}
              disabled={!canSubmit || status === 'success'}
            >
              {isSubmitting ? 'Submitting...' : isLastEntry ? 'Submit scores' : 'Next entry'}
            </button>
          </footer>
        </>
      )}
    </Dialog>
  );
}
