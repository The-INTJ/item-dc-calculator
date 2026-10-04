import { TracerAuth, TracerLobby } from '@/features/tracer';

interface LobbyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The lobby. A setup link (`/tracer?style=…&king=…`) prefills the new-game form. */
export default async function TracerLobbyPage({ searchParams }: LobbyPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (typeof value === 'string' ? [[key, value]] : [])),
  ).toString();
  return (
    <TracerAuth>
      <TracerLobby setupQuery={query} />
    </TracerAuth>
  );
}
