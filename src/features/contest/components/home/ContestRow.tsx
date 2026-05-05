import Link from 'next/link';
import type { HomepageContestRow } from '@/contest/lib/presentation/buildHomepageView';

interface ContestRowProps {
  row: HomepageContestRow;
}

export default function ContestRow({ row }: ContestRowProps) {
  return (
    <li>
      <Link href={row.href} className="contest-list-row">
        <span className="contest-list-row__avatar" aria-hidden="true">
          {row.initials}
        </span>
        <span className="contest-list-row__body">
          <span className="contest-list-row__name">{row.name}</span>
          <span className="contest-list-row__meta">
            {row.roundCount} rounds / {row.contestantCount} contestants
          </span>
        </span>
        {row.statusBadge && (
          <span
            className={`contest-status-badge contest-status-badge--${row.statusBadge.variant}`}
          >
            {row.statusBadge.label}
          </span>
        )}
      </Link>
    </li>
  );
}
