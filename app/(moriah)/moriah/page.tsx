import { MoriahDemo } from '@/features/moriah';
import { pageTitles, parsePageKey } from '@/features/moriah/content';

interface MoriahPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: MoriahPageProps) {
  const page = parsePageKey((await searchParams).page);
  return {
    title:
      page === 'home'
        ? 'Moriah Primitive Baptist Church — Design Preview'
        : `${pageTitles[page]} — Moriah Primitive Baptist Church`,
    robots: { index: false, follow: false },
  };
}

export default async function MoriahPage({ searchParams }: MoriahPageProps) {
  return <MoriahDemo page={parsePageKey((await searchParams).page)} />;
}
