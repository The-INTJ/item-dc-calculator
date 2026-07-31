'use client';

import { useEffect } from 'react';
import { Dialog, useMediaQuery, useTheme } from '@mui/material';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';
import { getRoundLabel } from '../../lib/domain/contestGetters';
import { useMatchupVoting } from '../../lib/hooks/useMatchupVoting';
import { VoteSheetBody } from './voteSheet';

interface VoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  contest: Contest;
  matchup: Matchup;
}

export function VoteModal({ open, onClose, onSubmitted, contest, matchup }: VoteModalProps) {
  const roundName = getRoundLabel(contest, matchup.roundId);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const voting = useMatchupVoting(contest, matchup);
  const { status, isMatchupOpen } = voting;

  // The matchup closed while the modal was open (live phase flip via the
  // realtime subscription), or a submit raced the close and was rejected.
  // Keep the "Scores submitted!" confirmation when the vote landed in time.
  const votingClosed = (!isMatchupOpen || status === 'closed') && status !== 'success';

  useEffect(() => {
    if (!open || status !== 'success') return;
    onSubmitted?.();
    const timer = setTimeout(onClose, 1500);
    return () => clearTimeout(timer);
  }, [open, status, onClose, onSubmitted]);

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

      <VoteSheetBody voting={voting} matchupId={matchup.id} votingClosed={votingClosed} />
    </Dialog>
  );
}
