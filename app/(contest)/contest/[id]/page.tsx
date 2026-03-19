'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contest/contexts/auth/AuthContext';
import { BracketView } from '@/contest/components/ui/BracketView';
import { VoteModal } from '@/contest/components/ui/VoteModal';
import { useResolvedContest } from '@/contest/lib/hooks/useResolvedContest';
import { contestApi } from '@/contest/lib/api/contestApi';
import { getContestantLabel } from '@/contest/lib/domain/contestLabels';
import { getUserContestRole } from '@/contest/lib/domain/userContestState';
import { buildBracketRoundsFromContest } from '@/contest/lib/presentation/buildBracketRoundsFromContest';

export default function ContestPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const { session } = useAuth();
  const { contest, status } = useResolvedContest(id);
  const rounds = contest ? buildBracketRoundsFromContest(contest) : [];

  const userId = session?.firebaseUid ?? session?.sessionId ?? null;
  const contestRole = contest ? getUserContestRole(userId, contest) : 'spectator';
  const contestantLabel = getContestantLabel(contest?.config);
  const showContestantButton = userId && contest && contestRole !== 'contestant';

  const handleRegisterContestant = async () => {
    if (!contest?.id || !userId) return;
    setRegistering(true);
    await contestApi.registerAsContestant(
      contest.id,
      userId,
      session?.profile.displayName ?? 'Guest',
    );
    setRegistering(false);
  };

  if (status === 'loading') {
    return (
      <div className="contest-landing">
        <div className="contest-card">Loading contest...</div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="contest-landing">
        <div className="contest-card">Contest not found.</div>
      </div>
    );
  }

  return (
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>{contest.name}</h1>
        <Link href={`/contest/${id}/display`} className="button-secondary">
          Display mode
        </Link>
      </section>

      <BracketView rounds={rounds} onRoundClick={setSelectedRoundId} />

      {showContestantButton && (
        <section className="contest-actions">
          <button
            className="button-secondary"
            onClick={handleRegisterContestant}
            disabled={registering}
          >
            {registering ? 'Registering...' : `Be a ${contestantLabel}`}
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
