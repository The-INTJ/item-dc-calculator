import SignedInLanding from '@/src/features/mixology/ViewSnippets/SignedInLanding';
import SignedOutLanding from '@/src/features/mixology/ViewSnippets/SignedOutLanding';
import { getCurrentUser } from '@/src/features/mixology/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  return user ? <SignedInLanding user={user} /> : <SignedOutLanding />;
}
