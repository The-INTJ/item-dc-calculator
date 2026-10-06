import {
  parseProjectType,
  parseServices,
  parseStnPage,
  SoundToNoteSite,
  stnTitles,
} from '@/features/sound-to-note';

interface SoundToNotePageProps {
  searchParams: Promise<{ page?: string; type?: string; service?: string }>;
}

export async function generateMetadata({ searchParams }: SoundToNotePageProps) {
  const page = parseStnPage((await searchParams).page);
  return {
    title: page === 'home' ? stnTitles.home : `${stnTitles[page]} — Alex Ferré · Sound To Note`,
    robots: { index: false, follow: false },
  };
}

export default async function SoundToNotePage({ searchParams }: SoundToNotePageProps) {
  const params = await searchParams;
  return (
    <SoundToNoteSite
      page={parseStnPage(params.page)}
      query={{
        type: parseProjectType(params.type),
        services: parseServices(params.service),
      }}
    />
  );
}
