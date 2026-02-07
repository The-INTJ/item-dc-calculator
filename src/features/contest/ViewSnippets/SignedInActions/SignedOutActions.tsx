/**
 * SignedOutLanding - Landing experience for visitors who are not signed in
 */

import { AuthPrimaryAction, AdminOnlyLink } from '@/components/ui';

export default function SignedOutLanding() {
  return (
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>Contest App</h1>
        <p>
          A contest-first experience for voting, scoring, and tracking contest matchups.
          Sign in or create a profile to start rating entries right away.
        </p>
        <div className="contest-actions">
          <AuthPrimaryAction
            signedOutLabel="Sign in or create an account"
            signedOutHref="/contest/onboard"
            className="button-primary"
            dataTestId="contest-auth-primary-action"
          />
          <AdminOnlyLink
            href="/contest/admin"
            className="button-secondary"
            dataTestId="contest-admin-link"
          >
            Admin dashboard
          </AdminOnlyLink>
        </div>
      </section>
    </div>
  );
}
