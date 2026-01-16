export const metadata = {
  title: 'Voting | Mixology Rating App',
  description: 'Voting flow for Mixology voters.',
};

export default function MixologyVotePage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Voting is coming soon</h1>
        <p>
          This placeholder is where the live contest voting flow will live. Use the onboarding page to
          confirm session state and auth flows.
        </p>
        <p>
          Everyone can vote unless they are registered as the mixologist for a drink in the current round.
        </p>
      </section>
    </div>
  );
}
