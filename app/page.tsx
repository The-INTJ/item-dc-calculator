import SignedInLanding from '@/mixology/ViewSnippets/SignedInLanding';
import SignedOutLanding from '@/mixology/ViewSnippets/SignedOutLanding';
import { getCurrentUser } from '@/mixology/lib/api/serverAuth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  return user ? <SignedInLanding user={user} /> : <SignedOutLanding />;
}
