'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Contest,
  ContestConfig,
  Matchup,
  ScoreEntry,
} from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { useMatchupsSubscription } from '../../lib/realtime';
import { contestApi } from '../../lib/api/contestApi';
import { getRoundLabel } from '../../lib/domain/contestGetters';
import {
  getActiveRoundIdFromMatchups,
  getMatchupsForRound,
} from '../../lib/domain/matchupGetters';
import { getEffectiveConfig } from '../../lib/domain/validation';
import { AdminContestants } from './AdminContestants';
import { AdminContestRounds } from './AdminContestRounds';
import { ContestConfigEditor } from './ContestConfigEditor';

interface ContestDetailsProps {
  contest: Contest;
  onContestUpdated: (contest: Contest) => void;
}

interface Participant {
  id: string;
  displayName: string;
  role: 'admin' | 'voter' | 'competitor' | 'contestant';
  votedCount: number;
  totalEntries: number;
  isActiveContestant: boolean;
  autoMax: boolean;
}

function buildParticipants(
  contest: Contest,
  matchups: Matchup[],
  contestScores: ScoreEntry[],
  selectedRoundId: string | null,
): Participant[] {
  const roundMatchups = selectedRoundId ? getMatchupsForRound(matchups, selectedRoundId) : [];
  const roundEntryIds = new Set(roundMatchups.flatMap((m) => m.entryIds));
  const roundEntries = (contest.entries ?? []).filter((e) => roundEntryIds.has(e.id));
  const roundContestantNames = new Set(
    roundEntries.map((e) => e.submittedBy?.toLowerCase()).filter(Boolean),
  );
  const isShakeOrScored = roundMatchups.some(
    (m) => m.phase === 'shake' || m.phase === 'scored',
  );

  const matchupIdsForRound = new Set(roundMatchups.map((m) => m.id));
  const voterScoreCounts = new Map<string, number>();
  for (const score of contestScores) {
    if (roundEntryIds.has(score.entryId) && (!score.matchupId || matchupIdsForRound.has(score.matchupId))) {
      voterScoreCounts.set(score.userId, (voterScoreCounts.get(score.userId) ?? 0) + 1);
    }
  }

  const seen = new Set<string>();
  const participants: Participant[] = [];

  for (const voter of contest.voters ?? []) {
    seen.add(voter.displayName.toLowerCase());
    const isContestant = roundContestantNames.has(voter.displayName.toLowerCase());
    participants.push({
      id: voter.id,
      displayName: voter.displayName,
      role: voter.role,
      votedCount: voterScoreCounts.get(voter.id) ?? 0,
      totalEntries: roundEntries.length,
      isActiveContestant: isContestant,
      autoMax: isContestant && isShakeOrScored,
    });
  }

  for (const entry of roundEntries) {
    const name = entry.submittedBy;
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    participants.push({
      id: `contestant-${name}`,
      displayName: name,
      role: 'contestant',
      votedCount: 0,
      totalEntries: roundEntries.length,
      isActiveContestant: true,
      autoMax: isShakeOrScored,
    });
  }

  return participants;
}

function ParticipantItem({ participant }: { participant: Participant }) {
  const voteStatus = participant.autoMax
    ? 'Auto max'
    : participant.votedCount > 0
      ? 'Voted'
      : 'Not voted';

  return (
    <li className="admin-detail-item admin-participant-item">
      <div className="admin-participant-item__info">
        <strong>{participant.displayName}</strong>
        <span className={`admin-role-badge admin-role-badge--${participant.role}`}>
          {participant.role}
        </span>
      </div>
      <span className={`admin-vote-status admin-vote-status--${participant.autoMax ? 'auto' : participant.votedCount > 0 ? 'voted' : 'pending'}`}>
        {voteStatus}
      </span>
    </li>
  );
}

export function ContestDetails({ contest, onContestUpdated }: ContestDetailsProps) {
  const router = useRouter();
  const { deleteContest, matchupsByContestId } = useContestStore();
  useMatchupsSubscription(contest.id);
  const matchups = matchupsByContestId[contest.id] ?? [];

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contestScores, setContestScores] = useState<ScoreEntry[]>([]);

  const rounds = contest.rounds ?? [];
  const activeRoundId = useMemo(
    () => getActiveRoundIdFromMatchups(rounds, matchups),
    [rounds, matchups],
  );

  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(activeRoundId);

  useEffect(() => {
    if (selectedRoundId && !rounds.some((r) => r.id === selectedRoundId)) {
      setSelectedRoundId(activeRoundId);
    } else if (!selectedRoundId && activeRoundId) {
      setSelectedRoundId(activeRoundId);
    }
  }, [rounds, activeRoundId, selectedRoundId]);

  const activeRoundLabel = getRoundLabel(contest, activeRoundId);
  const selectedRoundLabel = getRoundLabel(contest, selectedRoundId);
  const config = getEffectiveConfig(contest);
  const hasScores = contest.entries.some((e) => (e.voteCount ?? 0) > 0);
  const participants = buildParticipants(contest, matchups, contestScores, selectedRoundId);

  useEffect(() => {
    if (!contest.id) return;

    const fetchScores = async () => {
      const scoreGroups = await Promise.all(
        contest.entries.map((entry) => contestApi.getScoresForEntry(contest.id, entry.id)),
      );
      setContestScores(scoreGroups.flatMap((r) => (r.success ? r.data ?? [] : [])));
    };

    void fetchScores();
  }, [contest.id, contest.entries]);

  const handleSaveConfig = async (nextConfig: ContestConfig) => {
    const result = await contestApi.updateContestConfig(contest.id, nextConfig);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Failed to update config');
    }
    onContestUpdated(result.data);
  };

  const handleDeleteContest = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${contest.name}"?\n\nThis will permanently delete:\n- All rounds\n- All entries\n- All scores\n\nThis action cannot be undone.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError(null);

    const success = await deleteContest(contest.id);
    if (success) {
      router.push('/admin');
      return;
    }

    setDeleteError('Failed to delete contest');
    setIsDeleting(false);
  };

  return (
    <div className="admin-contest-details">
      <header className="admin-contest-details__header">
        <div>
          <h2>{contest.name}</h2>
          <p className="admin-detail-meta">
            {contest.location ?? 'No location'} - {activeRoundLabel}
          </p>
        </div>
        <button
          type="button"
          className="button-secondary button-secondary--danger"
          onClick={handleDeleteContest}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Contest'}
        </button>
      </header>

      {deleteError ? (
        <div className="admin-phase-controls__message--error" style={{ marginBottom: '1rem' }}>
          {deleteError}
        </div>
      ) : null}

      {!hasScores && <ContestConfigEditor contest={contest} onSave={handleSaveConfig} />}
      <AdminContestRounds
        contest={contest}
        config={config}
        matchups={matchups}
        selectedRoundId={selectedRoundId}
        onSelectRound={setSelectedRoundId}
      />
      <AdminContestants contest={contest} matchups={matchups} />

      <section className="admin-details-section">
        <h3>Participants ({participants.length})</h3>
        <p className="admin-detail-meta" style={{ marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
          Showing for {selectedRoundLabel}
        </p>
        {participants.length === 0 ? (
          <p className="admin-empty">No participants yet.</p>
        ) : (
          <ul className="admin-detail-list">
            {participants.map((p) => (
              <ParticipantItem key={p.id} participant={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
