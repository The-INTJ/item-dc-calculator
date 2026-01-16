export const metadata = {
  title: 'Shaw | Mixology Rating App',
  description: 'Shaw mixology location details.',
};

export default function ShawPage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Shaw</h1>
        <p>Shaw tasting details will be shared with voters ahead of the event.</p>
      </section>
      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Featured bars</h2>
          <p>We are finalizing the participating bars and cocktail pairings.</p>
        </div>
        <div className="mixology-card">
          <h2>Check-in</h2>
          <p>Guest arrival instructions and check-in flow will be added here.</p>
        </div>
      </section>
    </div>
  );
}
