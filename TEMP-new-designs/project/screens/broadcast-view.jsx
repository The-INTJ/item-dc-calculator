// BroadcastView.jsx — TV / display mode, large-format, "broadcast-grade".
// Designed for 1280×720 inside an artboard.

const BroadcastView = () => {
  return (
    <div data-theme="broadcast" style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(1200px 600px at 20% -10%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(900px 600px at 110% 110%, rgba(245,158,11,0.12), transparent 55%), #020617',
      color: '#fff',
      fontFamily: 'var(--font-display)',
      padding: '40px 56px',
      display: 'flex', flexDirection: 'column',
      gap: 28,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Top strip */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 32,
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(245,158,11,0.16)',
            color: 'var(--c-amber-300)',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            <span className="live-dot" style={{ background: 'var(--c-amber-400)' }}/>
            On Air · Round 1
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1, marginTop: 4 }}>
            Test 1 Mixology
          </div>
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.6)', fontSize: 18, letterSpacing: '-0.005em' }}>
            Set phase &middot; 4 contestants &middot; 2 rounds
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flex: '0 0 auto' }}>
          <BroadcastTile label="Now scoring" title="Old Mate" sub="vs Daisy Cutter" tone="active"/>
          <BroadcastTile label="Up next" title="Garden Sour" sub="vs Smoke & Honey" tone="next"/>
        </div>
      </div>

      {/* Bracket */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 56,
        flex: 1, minHeight: 0,
        alignItems: 'stretch',
      }}>
        <BroadcastRound title="Round 1" status="active">
          <Matchup a={{ name: 'Old Mate', maker: 'Jake', score: 24 }} b={{ name: 'Daisy Cutter', maker: 'John', score: 21 }} state="scoring"/>
          <Matchup a={{ name: 'Garden Sour', maker: 'Mira' }} b={{ name: 'Smoke & Honey', maker: 'Devi' }} state="upcoming"/>
        </BroadcastRound>
        <BroadcastRound title="Round 2" status="pending">
          <Matchup a={{ name: 'TBD' }} b={{ name: 'TBD' }} state="tbd"/>
        </BroadcastRound>
      </div>

      {/* Footer ticker */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 20px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--c-cyan-300)',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--c-cyan-400)' }}/>
          Vote feed
        </div>
        <div style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <strong style={{ color: '#fff' }}>Andrew</strong> scored <strong style={{ color: 'var(--c-amber-300)' }}>Old Mate</strong> 24/30 &nbsp;·&nbsp;
          <strong style={{ color: '#fff' }}>Drew</strong> scored <strong style={{ color: 'var(--c-amber-300)' }}>Daisy Cutter</strong> 21/30 &nbsp;·&nbsp;
          18 of 24 ballots in
        </div>
      </div>
    </div>
  );
};

const BroadcastTile = ({ label, title, sub, tone }) => {
  const accent = tone === 'active' ? 'var(--c-amber-300)' : 'var(--c-cyan-300)';
  return (
    <div style={{
      padding: '14px 18px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 14,
      minWidth: 200,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: accent,
      }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{sub}</div>
    </div>
  );
};

const BroadcastRound = ({ title, status, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--c-amber-300)',
        }}>Round</span>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</span>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: status === 'active' ? 'var(--c-amber-300)' : 'rgba(255,255,255,0.45)',
      }}>{status === 'active' ? 'Live' : 'Pending'}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
      {children}
    </div>
  </div>
);

const Matchup = ({ a, b, state }) => {
  const isScoring = state === 'scoring';
  const winner = isScoring && a.score > b.score ? 'a' : (isScoring && b.score > a.score ? 'b' : null);
  return (
    <div style={{
      padding: 18,
      background: isScoring ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
      border: '1px solid ' + (isScoring ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'),
      borderRadius: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {isScoring && (
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: '0 0 0 0 rgba(245,158,11,0.4)',
          borderRadius: 'inherit',
          animation: 'matchup-pulse 2.4s ease-out infinite',
          pointerEvents: 'none',
        }}/>
      )}
      <ContestantRow name={a.name} maker={a.maker} score={a.score} winner={winner === 'a'} state={state}/>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }}/>
      <ContestantRow name={b.name} maker={b.maker} score={b.score} winner={winner === 'b'} state={state}/>
    </div>
  );
};

const ContestantRow = ({ name, maker, score, winner, state }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em', color: state === 'tbd' ? 'rgba(255,255,255,0.35)' : '#fff' }}>
        {name}
      </div>
      {maker && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>by {maker}</div>}
    </div>
    {score != null ? (
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 32, fontWeight: 700,
        color: winner ? 'var(--c-amber-300)' : '#fff',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>{score}</div>
    ) : (
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 22, fontWeight: 700 }}>—</div>
    )}
  </div>
);

window.BroadcastView = BroadcastView;

if (typeof document !== 'undefined' && !document.getElementById('broadcast-anim')) {
  const s = document.createElement('style');
  s.id = 'broadcast-anim';
  s.textContent = `
    @keyframes matchup-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
      70%  { box-shadow: 0 0 0 14px rgba(245,158,11,0); }
      100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
    }
  `;
  document.head.appendChild(s);
}
