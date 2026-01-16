export const metadata = {
  title: 'Union Market | Mixology Rating App',
  description: 'Union Market mixology location details.',
};

export default function UnionMarketPage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Union Market</h1>
        <p>Details for the Union Market experience are on the way.</p>
      </section>
      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Schedule</h2>
          <p>Upcoming contest timing and tasting lineup will land here.</p>
        </div>
        <div className="mixology-card">
          <h2>Venue notes</h2>
          <p>Judging logistics and floor map information are coming soon.</p>
        </div>
      </section>
    </div>
  );
}
