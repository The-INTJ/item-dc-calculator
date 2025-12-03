import Link from 'next/link';

const roadmapSteps = [
  'Step 2: Data model and backend foundation',
  'Step 3: Authentication, roles, and basic access control',
  'Step 4: Contest and drink management (admin)',
  'Step 5: Current drink flow and basic voting',
  'Step 6: Live leaderboard and standings',
  'Step 7: Bracket modeling and display',
  'Step 8: Invite URL and cookie-based account creation',
  'Step 9: Polishing, analytics, and documentation cleanup',
];

export default function HomePage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Mixology Rating App</h1>
        <p>
          A contest-first experience for judging, scoring, and tracking craft cocktail matchups.
          The mixology flow is the primary entry point for event usage, tuned for judges and
          admins.
        </p>
        <div className="mixology-actions">
          <Link href="/mixology" className="button-primary">
            Enter the Mixology experience
          </Link>
        </div>
      </section>

      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Contest-focused shell</h2>
          <p>
            Dedicated mixology routing keeps contest tooling front and center without disrupting the existing
            calculator experience. Future screens for voting, standings, and brackets will plug in here.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Legacy preserved</h2>
          <p>
            The original shard DC calculator now lives at <strong>/legacy</strong>. Navigation keeps it discoverable
            while signaling that the mixology contest is the primary flow during events.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Documented plan</h2>
          <p>
            A dedicated progress README tracks architectural decisions and the step-by-step roadmap for
            building out contest features without compromising existing functionality.
          </p>
        </div>
      </section>

      <section className="mixology-roadmap">
        <h2>Upcoming steps</h2>
        <p>Step 1 is focused on scaffolding. The following phases are planned and documented for later iterations:</p>
        <ol>
          {roadmapSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
