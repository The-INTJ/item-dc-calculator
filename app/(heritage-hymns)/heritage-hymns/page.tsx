import { HeritageHymnsDemo, normalizeHeritageTab } from '@/features/heritage-hymns';

export default async function HeritageHymnsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;

  return <HeritageHymnsDemo initialTab={normalizeHeritageTab(params.tab)} />;
}
