export const metadata = {
  title: 'Bracket | Mixology Rating App',
  description: 'Bracket experience for the mixology contest.',
};

export default function MixologyBracketPage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Mixology Bracket</h1>
        <p>
          This bracket view is coming soon. Voters will follow the live progression here once the
          experience is ready.
        </p>
      </section>
      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Bracket status</h2>
          <p>We are preparing the knockout rounds and matchup schedule.</p>
        </div>
        <div className="mixology-card">
          <h2>Results tracking</h2>
          <p>Live scoring and round-by-round results will be displayed here.</p>
        </div>
      </section>
    </div>
  );
}
