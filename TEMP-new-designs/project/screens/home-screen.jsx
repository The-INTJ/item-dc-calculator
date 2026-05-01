// HomeScreen.jsx — signed-in landing (Contests list)

const HomeScreen = ({ density = 'comfortable', theme = 'light' }) => {
  return (
    <AppShell title="Home">
      {/* Hero card — restrained, brand-tinted but not gradient-heavy */}
      <section style={{
        background: 'linear-gradient(155deg, var(--c-slate-900), var(--c-slate-800))',
        color: '#fff',
        borderRadius: 'var(--r-2xl)',
        padding: '24px 22px 22px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          background: 'radial-gradient(560px 220px at 100% 0%, rgba(34,211,238,0.30), transparent 60%)',
          pointerEvents: 'none',
        }}/>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow" style={{ color: 'var(--c-cyan-300)', marginBottom: 8 }}>Welcome back</div>
          <h1 style={{ font: 'var(--t-h1)', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Andrew
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, marginBottom: 18, fontSize: 14, lineHeight: 1.5 }}>
            One contest is live. Two rounds pending your scoring.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--sm" style={{
              background: '#fff', color: 'var(--c-slate-900)',
            }}>Join Test 1 Mixology</button>
            <button className="btn btn--sm btn--tertiary" style={{
              color: '#fff', background: 'rgba(255,255,255,0.08)',
            }}>Browse all</button>
          </div>
        </div>
      </section>

      {/* Live now — only when something's actually live */}
      <section className="surface" style={{ padding: 'var(--pad-card)' }}>
        <div className="row row--between" style={{ marginBottom: 12 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="live-dot"/>
            <span className="eyebrow" style={{ color: 'var(--text-special)' }}>Live now</span>
          </div>
          <span className="badge badge--scoring badge--dot">Scoring</span>
        </div>
        <h3 style={{ font: 'var(--t-h3)', margin: 0, fontWeight: 700, letterSpacing: '-0.015em' }}>
          Test 1 Mixology
        </h3>
        <div className="row" style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)', gap: 6 }}>
          <span>Round 1 of 2</span>
          <span aria-hidden>·</span>
          <span>4 entries</span>
          <span aria-hidden>·</span>
          <span>You haven't voted</span>
        </div>
        <button className="btn btn--accent btn--block" style={{ marginTop: 14 }}>
          Score Round 1
        </button>
      </section>

      {/* Contest list */}
      <section>
        <div className="row row--between" style={{ marginBottom: 10, padding: '0 4px' }}>
          <h2 style={{ font: 'var(--t-h3)', margin: 0, fontWeight: 700, letterSpacing: '-0.015em' }}>
            Contests
          </h2>
          <span className="muted" style={{ fontSize: 13 }}>3</span>
        </div>
        <div className="stack stack--tight">
          <ContestRow name="Test 1 Mixology" rounds={2} entries={4} status="active"/>
          <ContestRow name="Spring Cocktail Open" rounds={4} entries={12} status="pending"/>
          <ContestRow name="Winter Mixology Cup" rounds={3} entries={8} status="closed"/>
        </div>
      </section>

      {/* Past activity placeholder */}
      <div style={{ height: 24 }}/>
    </AppShell>
  );
};

const ContestRow = ({ name, rounds, entries, status }) => {
  const statusMap = {
    active: { label: 'Active', cls: 'badge--active' },
    pending: { label: 'Pending', cls: 'badge--pending' },
    closed: { label: 'Closed', cls: 'badge--closed' },
  };
  const s = statusMap[status];
  return (
    <button className="card" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      width: '100%', textAlign: 'left',
      padding: 'var(--pad-row) var(--pad-card)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg, var(--c-cyan-400), var(--c-cyan-600))',
        display: 'grid', placeItems: 'center',
        color: '#011217', fontWeight: 700, fontSize: 14,
        flex: '0 0 auto',
      }}>{name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{name}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {rounds} rounds · {entries} entries
        </div>
      </div>
      <span className={`badge ${s.cls} badge--dot`} style={{ flex: '0 0 auto' }}>{s.label}</span>
    </button>
  );
};

window.HomeScreen = HomeScreen;
window.ContestRow = ContestRow;
