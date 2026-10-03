import { TracerAuth, TracerLobby } from '@/features/tracer';

export default function TracerLobbyPage() {
  return (
    <TracerAuth>
      <TracerLobby />
    </TracerAuth>
  );
}
