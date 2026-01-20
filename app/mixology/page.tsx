import { AuthPrimaryAction } from '../components/AuthPrimaryAction';
import { AdminOnlyLink } from '../components/AdminOnlyLink';

export const metadata = {
  title: 'Mixology Rating App',
  description: 'Contest-first shell for rating and ranking mixology entries.',
};

export default function MixologyPage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Mixology Contest!</h1>
        <p>
          Sign in or create a profile to start rating drinks -- and even register as a Mixologist!
        </p>
        <div className="mixology-actions">
          <AuthPrimaryAction
            signedOutLabel="Sign in or create an account"
            signedOutHref="/mixology/onboard"
            className="button-primary"
          />
          <AdminOnlyLink href="/mixology/admin" className="button-secondary">
            Admin dashboard
          </AdminOnlyLink>
        </div>
      </section>
    </div>
  );
}
