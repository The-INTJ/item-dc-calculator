'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Contest, ContestConfig, ScoreEntry } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { adminApi } from '../../lib/api/adminApi';
import { contestApi } from '../../lib/api/contestApi';
import { getEntriesForRound, getRoundById, getRoundLabel } from '../../lib/domain/contestGetters';
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
  contestScores: ScoreEntry[],
  selectedRoundId: string | null,
): Participant[] {
  const roundId = selectedRoundId ?? contest.activeRoundId;
  const round = contest.rounds?.find((r) => r.id === roundId);
  const roundEntries = roundId ? getEntriesForRound(contest, roundId) : [];
  const roundContestantNames = new Set(roundEntries.map((e) => e.submittedBy?.toLowerCase()));
  const isShakeOrScored = round?.state === 'shake' || round?.state === 'scored';

  const roundEntryIds = new Set(roundEntries.map((e) => e.id));
  const voterScoreCounts = new Map<string, number>();
  for (const score of contestScores) {
    if (roundEntryIds.has(score.entryId)) {
      voterScoreCounts.set(score.userId, (voterScoreCounts.get(score.userId) ?? 0) + 1);
    }
  }

  const seen = new Set<string>();
  const participants: Participant[] = [];

  // Add registered voters (contest members)
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

  // Add contestants not already in voters (from selected round entries only)
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

function getRoleBadgeLabel(role: Participant['role']) {
  return role;
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
          {getRoleBadgeLabel(participant.role)}
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
  const { deleteContest } = useContestStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contestScores, setContestScores] = useState<ScoreEntry[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(
    contest.activeRoundId ?? null,
  );

  // Keep selectedRoundId in sync when contest changes
  useEffect(() => {
    if (selectedRoundId && !contest.rounds?.some((r) => r.id === selectedRoundId)) {
      setSelectedRoundId(contest.activeRoundId ?? null);
    }
  }, [contest.rounds, contest.activeRoundId, selectedRoundId]);

  const activeRoundLabel = getRoundLabel(contest, contest.activeRoundId);
  const selectedRoundLabel = getRoundLabel(contest, selectedRoundId);
  const config = getEffectiveConfig(contest);
  const hasScores = contest.entries.some((e) => (e.voteCount ?? 0) > 0);
  const participants = buildParticipants(contest, contestScores, selectedRoundId);

  useEffect(() => {
    if (!contest.id) {
      return;
    }

    const fetchScores = async () => {
      const scoreGroups = await Promise.all(
        contest.entries.map((entry) => contestApi.getScoresForEntry(contest.id, entry.id)),
      );

      setContestScores(scoreGroups.flat());
    };

    void fetchScores();
  }, [contest.id, contest.entries]);

  const handleSaveConfig = async (nextConfig: ContestConfig) => {
    const result = await adminApi.updateContestConfig(contest.id, nextConfig);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Failed to update config');
    }

    onContestUpdated(result.data);
  };

  const handleDeleteContest = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${contest.name}"?\n\nThis will permanently delete:\n- All rounds\n- All entries\n- All scores\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

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
        selectedRoundId={selectedRoundId}
        onSelectRound={setSelectedRoundId}
      />
      <AdminContestants contest={contest} selectedRoundId={selectedRoundId} />

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
