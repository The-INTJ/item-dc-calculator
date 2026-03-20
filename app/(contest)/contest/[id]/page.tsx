import { notFound } from 'next/navigation';
import { loadProvider } from '@/app/api/contest/_lib/provider';
import ContestPageClient from './ContestPageClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContestPage({ params }: PageProps) {
  const { id } = await params;
  const provider = await loadProvider();
  const result = await provider.contests.list();

  const contest = result.success
    ? result.data?.find((c) => c.id === id || c.slug === id) ?? null
    : null;

  if (!contest) {
    notFound();
  }

  return <ContestPageClient contestId={id} initialContest={contest} />;
}
