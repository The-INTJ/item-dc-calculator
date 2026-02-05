import SignedInLanding from '@/features/mixology/experiences/SignedInLanding';
import SignedOutLanding from '@/features/mixology/experiences/SignedOutLanding';
import { getCurrentUser } from '@/features/mixology/server/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  return user ? <SignedInLanding user={user} /> : <SignedOutLanding />;
}
