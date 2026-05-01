// SystemReference.jsx — design system reference page (tokens + components)

const Swatch = ({ name, value, varName }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: value, border: '1px solid var(--border-subtle)',
      flex: '0 0 auto',
    }}/>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
      <div style={{ font: 'var(--t-helper)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
        {varName}
      </div>
    </div>
    <div style={{ font: 'var(--t-helper)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{value}</div>
  </div>
);

const Block = ({ title, sub, children, style }) => (
  <section style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--r-card)',
    padding: 24,
    boxShadow: 'var(--shadow-1)',
    ...style,
  }}>
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ font: 'var(--t-h3)', margin: 0, fontWeight: 700, letterSpacing: '-0.015em' }}>{title}</h2>
      {sub && <p className="muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 0 }}>{sub}</p>}
    </div>
    {children}
  </section>
);

const SystemReference = () => {
  return (
    <div style={{ padding: 32, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Design system · v1</div>
        <h1 style={{ font: 'var(--t-h1)', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
          ContestApp
        </h1>
        <p className="muted" style={{ fontSize: 15, marginTop: 8, maxWidth: 680 }}>
          Mobile-first refresh of the contest design system. Keeps the slate + cyan brand
          base, reserves amber strictly for live/broadcast moments, and adds a proper semantic
          token layer on top.
        </p>
      </div>

      {/* Color */}
      <Block title="Brand & neutrals" sub="Primitives — slate is the spine, cyan is interactive.">
        <Swatch name="Cyan 500" value="#06b6d4" varName="--c-cyan-500"/>
        <Swatch name="Cyan 400" value="#22d3ee" varName="--c-cyan-400"/>
        <Swatch name="Slate 900" value="#0f172a" varName="--c-slate-900"/>
        <Swatch name="Slate 700" value="#334155" varName="--c-slate-700"/>
        <Swatch name="Slate 500" value="#64748b" varName="--c-slate-500"/>
        <Swatch name="Slate 200" value="#e2e8f0" varName="--c-slate-200"/>
        <Swatch name="Slate 50"  value="#f8fafc" varName="--c-slate-50"/>
      </Block>

      <Block title="Status & semantic" sub="Amber is reserved for live/special moments only.">
        <Swatch name="Amber (live)"   value="#f59e0b" varName="--c-amber-500"/>
        <Swatch name="Green (success)" value="#10b981" varName="--c-green-500"/>
        <Swatch name="Red (danger)"    value="#ef4444" varName="--c-red-500"/>
        <Swatch name="Cyan (info)"     value="#06b6d4" varName="--c-cyan-500"/>
        <div style={{ height: 12 }}/>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="badge badge--pending badge--dot">Pending</span>
          <span className="badge badge--scoring badge--dot">Scoring</span>
          <span className="badge badge--active badge--dot">Active</span>
          <span className="badge badge--closed badge--dot">Closed</span>
          <span className="badge badge--success badge--dot">Submitted</span>
          <span className="badge badge--danger badge--dot">Error</span>
          <span className="badge badge--live">Live</span>
        </div>
      </Block>

      {/* Type */}
      <Block title="Typography" sub="Inter for UI, Inter Tight for display, JetBrains Mono for stats." style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: 14, alignItems: 'baseline' }}>
          <span className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>display · 64</span>
          <span style={{ font: 'var(--t-display)', fontWeight: 700, letterSpacing: '-0.025em' }}>Test 1 Mixology</span>
          <span className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>h1 · 34</span>
          <span style={{ font: 'var(--t-h1)', fontWeight: 700, letterSpacing: '-0.02em' }}>Round 1 results</span>
          <span className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>h3 · 22</span>
          <span style={{ font: 'var(--t-h3)', fontWeight: 700, letterSpacing: '-0.015em' }}>Score entries</span>
          <span className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>body · 15</span>
          <span style={{ font: 'var(--t-body)' }}>The host hasn't seeded matchups for this round yet.</span>
          <span className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>meta · 13</span>
          <span style={{ font: 'var(--t-meta)', color: 'var(--text-muted)' }}>2 rounds · 4 entries · Live updates</span>
          <span className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>label · 11</span>
          <span className="eyebrow">Now scoring</span>
        </div>
      </Block>

      {/* Buttons */}
      <Block title="Actions" sub="One spec, no per-surface remixes. Live action gets the amber pulse.">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn--primary">Primary</button>
          <button className="btn btn--secondary">Secondary</button>
          <button className="btn btn--accent">Accent</button>
          <button className="btn btn--tertiary">Tertiary</button>
          <button className="btn btn--danger">Danger</button>
          <button className="btn btn--live">Go live</button>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn--primary btn--sm">Small</button>
          <button className="btn btn--primary">Default</button>
          <button className="btn btn--primary btn--lg">Large</button>
          <button className="btn btn--primary" disabled>Disabled</button>
        </div>
      </Block>

      {/* Roles */}
      <Block title="Roles & badges" sub="Distinct chips by semantic role. No more amber double-duty.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <span className="badge badge--admin">Admin</span>
          <span className="badge badge--viewer">Viewer</span>
          <span className="badge badge--competitor">Competitor</span>
          <span className="badge badge--contestant">Contestant</span>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          Replaces the red "Admin" + clashing amber "Contestant" combo from the current build.
        </div>
      </Block>

      {/* Surfaces */}
      <Block title="Surfaces & radii" sub="One default card radius (12px). Pills reserved for chips.">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="surface" style={{ width: 140, height: 90, padding: 12 }}>
            <div className="eyebrow">Surface</div>
            <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>Default card</div>
          </div>
          <div className="surface surface--raised" style={{ width: 140, height: 90, padding: 12 }}>
            <div className="eyebrow">Raised</div>
            <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>Elevation 2</div>
          </div>
          <div className="surface surface--sunken" style={{ width: 140, height: 90, padding: 12 }}>
            <div className="eyebrow">Sunken</div>
            <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13 }}>Inputs / sheets</div>
          </div>
        </div>
      </Block>

      {/* Form */}
      <Block title="Forms" sub="One field anatomy across auth, admin, and CTAs.">
        <div className="field">
          <label className="field__label">Display name</label>
          <input className="input" defaultValue="Andrew Taylor"/>
          <span className="field__helper">Shown to other voters and on the broadcast feed.</span>
        </div>
        <div style={{ height: 12 }}/>
        <div className="row" style={{ gap: 8 }}>
          <button className="segmented" role="tablist">
            <span className="segmented__item" aria-pressed="true">All</span>
            <span className="segmented__item" aria-pressed="false">Voters</span>
            <span className="segmented__item" aria-pressed="false">Admins</span>
          </button>
        </div>
      </Block>

      {/* Spacing */}
      <Block title="Spacing & density" sub="Consolidated 8-step scale. Density toggle swaps card/row paddings." style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          {[4, 8, 12, 16, 20, 24, 32, 48].map(v => (
            <div key={v} style={{ textAlign: 'center' }}>
              <div style={{ width: v, height: v, background: 'var(--c-cyan-500)', borderRadius: 4, marginInline: 'auto' }}/>
              <div className="muted" style={{ fontSize: 11, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{v}px</div>
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
};

window.SystemReference = SystemReference;
