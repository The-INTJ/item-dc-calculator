import Link from 'next/link';

export const metadata = {
  title: 'Mixology Rating App',
  description: 'Contest-first shell for rating and ranking mixology entries.',
};

export default function MixologyPage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Mixology contest hub</h1>
        <p>
          Sign in or create a judge profile to start rating drinks and tracking matchups during the event.
          The onboarding flow gets every judge ready in just a few taps.
        </p>
        <div className="mixology-actions">
          <Link href="/mixology/onboard" className="button-primary">
            Sign in or create an account
          </Link>
          <Link href="/mixology/admin" className="button-secondary">
            Admin dashboard
          </Link>
        </div>
      </section>

      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Onboarding built for events</h2>
          <p>
            Judges can join quickly as guests or sign in with Google to sync their ratings across devices.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Judge-friendly rating flow</h2>
          <p>
            Once onboarded, the flow moves straight into drink voting so every judge can stay focused on the
            tasting.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Admin control</h2>
          <p>
            Contest organizers can manage entries, pacing, and results from the admin dashboard.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Data model foundation</h2>
          <p>
            We seeded contest, drink, judge, and scoring structures to back the upcoming flows. The initial
            read-only API at <code>/api/mixology/contests</code> provides the current contest state for client
            prototypes and admin tooling.
          </p>
        </div>
      </section>
    </div>
  );
}
