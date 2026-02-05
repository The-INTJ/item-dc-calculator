/**
 * SignedOutLanding - Landing experience for visitors who are not signed in
 */

import { AuthPrimaryAction, AdminOnlyLink } from '@/components/ui';

export default function SignedOutLanding() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Mixology Rating App</h1>
        <p>
          A contest-first experience for voting, scoring, and tracking craft cocktail matchups.
          Sign in or create a profile to start rating drinks right away.
        </p>
        <div className="mixology-actions">
          <AuthPrimaryAction
            signedOutLabel="Sign in or create an account"
            signedOutHref="/contest/onboard"
            className="button-primary"
            dataTestId="mixology-auth-primary-action"
          />
          <AdminOnlyLink
            href="/contest/admin"
            className="button-secondary"
            dataTestId="mixology-admin-link"
          >
            Admin dashboard
          </AdminOnlyLink>
        </div>
      </section>
    </div>
  );
}
