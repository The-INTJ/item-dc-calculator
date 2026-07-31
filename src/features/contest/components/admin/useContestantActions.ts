'use client';

import { useState } from 'react';
import type { Contest } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import type { ParticipantDetails } from './participantDetails';

/**
 * Owns the participant admin actions (entry naming, adding contestants,
 * removal confirmation) plus card expansion and shared error state.
 */
export function useContestantActions(contest: Contest) {
  const { addContestant, removeContestant, setMatchupEntryName } = useContestStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<ParticipantDetails | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSetEntryName = async (matchupId: string, entryId: string, name: string): Promise<boolean> => {
    setActionError(null);
    const result = await setMatchupEntryName(contest.id, matchupId, entryId, { name });
    if (!result) {
      setActionError('Failed to update entry');
      return false;
    }
    return true;
  };

  const handleAddContestant = async (displayName: string): Promise<boolean> => {
    setActionError(null);
    const created = await addContestant(contest.id, { displayName });
    return Boolean(created);
  };

  const confirmRemoval = async () => {
    if (!pendingRemoval?.contestantId) return;
    setActionError(null);
    const ok = await removeContestant(contest.id, pendingRemoval.contestantId);
    if (!ok) setActionError('Failed to remove contestant');
    setPendingRemoval(null);
  };

  return {
    expandedIds,
    actionError,
    pendingRemoval,
    setPendingRemoval,
    toggleExpanded,
    handleSetEntryName,
    handleAddContestant,
    confirmRemoval,
  };
}
