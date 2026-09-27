import { PorticoDemo, parsePorticoPage, porticoTitles } from '@/features/moriah/portico';

interface PorticoPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: PorticoPageProps) {
  const page = parsePorticoPage((await searchParams).page);
  return {
    title:
      page === 'home'
        ? 'Moriah Primitive Baptist Church — Portico Preview'
        : `${porticoTitles[page]} — Moriah Primitive Baptist Church`,
    robots: { index: false, follow: false },
  };
}

export default async function MoriahPorticoPage({ searchParams }: PorticoPageProps) {
  return <PorticoDemo page={parsePorticoPage((await searchParams).page)} />;
}
