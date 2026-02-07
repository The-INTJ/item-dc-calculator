'use client';

import { useParams } from 'next/navigation';
import { useContestStore } from '@/src/features/contest/contexts/contest/ContestContext';

export default function ContestPage() {
  const params = useParams();
  const id = params.id as string;
  const { contests } = useContestStore();
  
  const contest = contests.find((c) => c.id === id);
  const contestName = contest?.name ?? 'Contest';

  return (
    <div>
      <h1>{contestName}</h1>
      <p>Round ID: {id}</p>
    </div>
  );
}
