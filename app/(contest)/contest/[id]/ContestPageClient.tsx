'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { BracketView } from '@/contest/components/ui/BracketView';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';
import { contestApi } from '@/contest/lib/api/contestApi';
import { getContestantLabel, getEntryLabel } from '@/contest/lib/domain/contestLabels';
import { getUserContestRole } from '@/contest/lib/domain/userContestState';
import { buildBracketRoundsFromContest } from '@/contest/lib/presentation/buildBracketRoundsFromContest';
import type { Contest } from '@/contest/contexts/contest/contestTypes';

interface ContestPageClientProps {
  contestId: string;
  initialContest: Contest;
}

export default function ContestPageClient({ contestId, initialContest }: ContestPageClientProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [showEntryInput, setShowEntryInput] = useState(false);
  const [entryName, setEntryName] = useState('');
  const { session } = useAuth();

  // Real-time subscription keeps contest up-to-date after initial server render
  const { contest: liveContest } = useResolvedContest(contestId);
  const contest = liveContest ?? initialContest;

  const rounds = buildBracketRoundsFromContest(contest);
  const userId = session?.firebaseUid ?? session?.sessionId ?? null;
  const contestRole = getUserContestRole(userId, contest);
  const contestantLabel = getContestantLabel(contest.config);
  const entryLabel = getEntryLabel(contest.config);
  const showContestantButton = userId && contestRole !== 'contestant';

  const handleRegisterContestant = async () => {
    if (!contest.id || !userId) return;
    if (!showEntryInput) {
      setShowEntryInput(true);
      return;
    }
    if (!entryName.trim()) return;
    setRegistering(true);
    await contestApi.registerAsContestant(
      contest.id,
      userId,
      session?.profile.displayName ?? 'Guest',
      entryName.trim(),
    );
    setShowEntryInput(false);
    setEntryName('');
    setRegistering(false);
  };

  return (
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>{contest.name}</h1>
        <Link href={`/contest/${contestId}/display`} className="button-secondary">
          Display mode
        </Link>
      </section>

      <BracketView rounds={rounds} onRoundClick={setSelectedRoundId} />

      {showContestantButton && (
        <section className="contest-actions" style={{ flexDirection: 'column', alignItems: 'stretch', maxWidth: 400 }}>
          {showEntryInput && (
            <input
              type="text"
              className="auth-field-input"
              placeholder={`${entryLabel} name (e.g. "Smoky Paloma")`}
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegisterContestant(); }}
              autoFocus
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            />
          )}
          <button
            className="button-secondary"
            onClick={handleRegisterContestant}
            disabled={registering || (showEntryInput && !entryName.trim())}
          >
            {registering
              ? 'Registering...'
              : showEntryInput
                ? `Register as ${contestantLabel}`
                : `Be a ${contestantLabel}`}
          </button>
        </section>
      )}

      {contestRole === 'contestant' && (
        <section className="contest-actions">
          <p className="contest-role-badge">You are a {contestantLabel}</p>
        </section>
      )}

      {selectedRoundId && (
        <VoteModal
          open
          onClose={() => setSelectedRoundId(null)}
          contest={contest}
          roundId={selectedRoundId}
        />
      )}
    </div>
  );
}
