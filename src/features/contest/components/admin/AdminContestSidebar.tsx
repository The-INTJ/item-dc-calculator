'use client';

import { Button } from '@/components/ui';
import type { Contest } from '../../contexts/contest/contestTypes';
import { ContestCard } from './ContestCard';
import { MaterialSymbol } from '../ui/MaterialSymbol';

interface AdminContestSidebarProps {
  contests: Contest[];
  selectedContestId: string | undefined;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (contest: Contest) => void;
}

/** The contest list. Starts collapsed so small screens open on the details. */
export function AdminContestSidebar({
  contests,
  selectedContestId,
  collapsed,
  onToggle,
  onSelect,
}: AdminContestSidebarProps) {
  return (
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`}>
      <button type="button" className="admin-sidebar__toggle" onClick={onToggle}>
        <span>Contests ({contests.length})</span>
        <MaterialSymbol
          name={collapsed ? 'expand_more' : 'expand_less'}
          className="admin-sidebar__chevron"
        />
      </button>
      <div className="admin-sidebar__body">
        {!contests || contests.length === 0 ? (
          <p className="admin-empty">No contests found.</p>
        ) : (
          <div className="admin-contest-list">
            {contests.map((contest) => (
              <ContestCard
                key={contest.id}
                contest={contest}
                onSelect={onSelect}
                isSelected={selectedContestId === contest.id}
              />
            ))}
          </div>
        )}
        <div className="admin-add-contest">
          <Button href="/admin/contest-setup" variant="primary">
            Create New Contest
          </Button>
        </div>
      </div>
    </aside>
  );
}
