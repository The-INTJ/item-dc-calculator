import SignedInLanding from '@/contest/ViewSnippets/SignedInLanding';
import SignedOutLanding from '@/contest/ViewSnippets/SignedOutLanding';
import { getCurrentUser } from '@/contest/lib/api/serverAuth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  return user ? <SignedInLanding user={user} /> : <SignedOutLanding />;
}
