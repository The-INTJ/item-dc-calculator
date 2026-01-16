export const metadata = {
  title: 'Navy Yard | Mixology Rating App',
  description: 'Navy Yard mixology location details.',
};

export default function NavyYardPage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Navy Yard</h1>
        <p>The Navy Yard experience is being planned now. Stay tuned for updates.</p>
      </section>
      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Round schedule</h2>
          <p>Judging rounds and timing will be posted here once confirmed.</p>
        </div>
        <div className="mixology-card">
          <h2>Judge resources</h2>
          <p>Venue-specific scoring guidance and resources will be listed here.</p>
        </div>
      </section>
    </div>
  );
}
