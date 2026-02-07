import SignedInLanding from '@/src/features/contest/ViewSnippets/SignedInActions/SignedInActions';
import SignedOutLanding from '@/src/features/contest/ViewSnippets/SignedInActions/SignedOutActions';
import { getCurrentUser } from '@/contest/lib/api/serverAuth';
import ListOfContests from '@/src/features/contest/ViewSnippets/DataDisplays/ListOfContests';
import styles from './page.module.scss';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const userOptions = user ? <SignedInLanding user={user} /> : <SignedOutLanding />;

  return (
    <div className={styles.landingPage}>
      {userOptions}
      <ListOfContests />
    </div>
  );
}
