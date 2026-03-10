import SignedInLanding from '@/contest/components/home/SignedInLanding';
import SignedOutLanding from '@/contest/components/home/SignedOutLanding';
import { getCurrentUser } from '@/contest/lib/api/serverAuth';
import ContestList from '@/contest/components/home/ContestList';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const userOptions = user ? <SignedInLanding user={user} /> : <SignedOutLanding />;

  return (
    <div className={styles.landingPage}>
      {userOptions}
      <ContestList />
    </div>
  );
}
