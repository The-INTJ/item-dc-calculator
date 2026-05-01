// ContestDetailScreen.jsx

const ContestDetailScreen = ({ density = 'comfortable' }) => {
  const [activeRound, setActiveRound] = React.useState(0);
  return (
    <AppShell title="Test 1 Mixology">
      {/* Contest header */}
      <section style={{ padding: '0 0 4px' }}>
        <div className="row" style={{ gap: 8, marginBottom: 6 }}>
          <span className="eyebrow">Mixology</span>
          <span aria-hidden style={{ color: 'var(--border-default)' }}>·</span>
          <span className="muted" style={{ fontSize: 13 }}>Set phase</span>
        </div>
        <h1 style={{
          font: 'var(--t-h1)', margin: 0, fontWeight: 700, letterSpacing: '-0.02em',
        }}>Test 1 Mixology</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 6, marginBottom: 0 }}>
          2 rounds · 4 entries · Live updates
        </p>
      </section>

      {/* Round picker — segmented, NOT bigass tabs */}
      <div className="tab-strip" role="tablist" aria-label="Rounds">
        {[
          { n: 1, status: 'pending', label: 'Pending' },
          { n: 2, status: 'pending', label: 'Pending' },
        ].map((r, i) => (
          <button
            key={r.n}
            role="tab"
            aria-selected={activeRound === i}
            className="tab"
            onClick={() => setActiveRound(i)}
            style={{ flex: 1 }}
          >
            <span className="tab__title">Round {r.n}</span>
            <span className="tab__sub">{r.label}</span>
          </button>
        ))}
      </div>

      {/* Round panel */}
      <section className="card" style={{ padding: 'var(--pad-card)' }}>
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <span className="badge badge--pending badge--dot">Not seeded</span>
        </div>
        <h2 style={{ font: 'var(--t-h2)', margin: 0, fontWeight: 700, letterSpacing: '-0.015em' }}>
          Round {activeRound + 1}
        </h2>
        <p className="muted" style={{ fontSize: 14, marginTop: 8, marginBottom: 16 }}>
          No matchups have been set for this round yet. The host will seed entries shortly.
        </p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--secondary btn--sm" style={{ flex: 1 }}>View bracket</button>
          <button className="btn btn--tertiary btn--sm" style={{ flex: 1 }}>Notify me</button>
        </div>
      </section>

      {/* Contestant CTA — restrained, doesn't fight the round panel */}
      <section style={{
        background: 'var(--bg-surface-sunken)',
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--r-card)',
        padding: 'var(--pad-card)',
      }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Want in?</div>
        <div style={{ fontSize: 14, color: 'var(--text-default)', marginBottom: 12 }}>
          Sign up with your drink to enter Test 1 Mixology.
        </div>
        <button className="btn btn--primary btn--block">Become a Contestant</button>
      </section>

      {/* Entries scroll preview */}
      <section>
        <div className="row row--between" style={{ marginBottom: 10, padding: '0 4px' }}>
          <h3 style={{ font: 'var(--t-h4)', margin: 0, fontWeight: 700 }}>Entries</h3>
          <span className="muted" style={{ fontSize: 13 }}>4</span>
        </div>
        <div className="stack stack--tight">
          <EntryRow name="Old Mate" maker="Jake" />
          <EntryRow name="Daisy Cutter" maker="John" />
          <EntryRow name="Garden Sour" maker="Mira" />
          <EntryRow name="Smoke & Honey" maker="Devi" />
        </div>
      </section>

      <div style={{ height: 16 }}/>
    </AppShell>
  );
};

const EntryRow = ({ name, maker }) => (
  <div className="card" style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 'var(--pad-row) var(--pad-card)',
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: 'repeating-linear-gradient(45deg, var(--c-slate-100) 0 6px, var(--c-slate-200) 6px 12px)',
      flex: '0 0 auto',
    }}/>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
      <div className="muted" style={{ fontSize: 12 }}>by {maker}</div>
    </div>
    <span className="badge badge--pending">Unscored</span>
  </div>
);

window.ContestDetailScreen = ContestDetailScreen;
