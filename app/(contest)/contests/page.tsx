import SignedInLanding from '@/contest/components/home/SignedInLanding';
import SignedOutLanding from '@/contest/components/home/SignedOutLanding';
import { getCurrentUser } from '@/contest/lib/server/serverAuth';
import ContestList from '@/contest/components/home/ContestList';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export default async function ContestsPage({
  searchParams,
}: {
  searchParams: Promise<{ contest?: string }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const featuredContestId = params.contest;
  const userOptions = user ? <SignedInLanding user={user} /> : <SignedOutLanding />;

  return (
    <div className={styles.landingPage}>
      {!featuredContestId && userOptions}
      <ContestList featuredContestId={featuredContestId} />
    </div>
  );
}
