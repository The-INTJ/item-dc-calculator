import Link from 'next/link';

const plannedFeatures = [
  'Judge-friendly current drink view with live updates',
  'Admin controls for contests, drinks, and bracket rounds',
  'Voting with 1–10 ratings and standings aggregation',
  'Invite-based onboarding tuned for event devices',
  'Read-only API endpoints that surface contest state for clients and tools',
];

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
          This section will host the full judging experience: voting on drinks, tracking brackets, and viewing
          live standings. Step 1 introduces the shell and routing so we can build features without impacting
          the legacy shard DC calculator.
        </p>
        <div className="mixology-actions">
          <Link href="/mixology/admin" className="button-primary">
            Admin Dashboard
          </Link>
          <Link href="/legacy" className="button-secondary">
            Visit the legacy calculator
          </Link>
        </div>
      </section>

      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Where features will live</h2>
          <p>
            Contest screens, admin tools, and participant flows will be added here in later steps. The routing
            keeps them isolated from the calculator so both experiences can evolve independently.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Event-first navigation</h2>
          <p>
            The global header highlights mixology as the default destination while leaving a clear secondary
            path back to the original calculator for anyone who needs it.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Planned capabilities</h2>
          <p>
            Upcoming steps will introduce the models, roles, voting flows, standings, brackets, and invite
            handling described in the roadmap. This page will expand to surface those features as they arrive.
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

      <section className="mixology-roadmap">
        <h2>Ready for upcoming development</h2>
        <p>Future phases will build on this shell. Highlights include:</p>
        <ol>
          {plannedFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
