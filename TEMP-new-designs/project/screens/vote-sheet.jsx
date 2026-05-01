// VoteSheet.jsx — bottom sheet voting UX (mobile-first)
// Renders inside the phone frame as a "sheet" on top of the contest detail
// view, so users can see this is a contextual modal pattern.

const VoteSheet = ({ density = 'comfortable' }) => {
  const [scores, setScores] = React.useState({ presentation: 7, balance: 6, creativity: 8 });
  const [activeEntry, setActiveEntry] = React.useState(0);
  const entries = [
    { name: 'Old Mate', maker: 'Jake' },
    { name: 'Daisy Cutter', maker: 'John' },
    { name: 'Garden Sour', maker: 'Mira' },
    { name: 'Smoke & Honey', maker: 'Devi' },
  ];
  const cats = [
    { id: 'presentation', label: 'Presentation' },
    { id: 'balance', label: 'Balance' },
    { id: 'creativity', label: 'Creativity' },
  ];
  return (
    <div style={{
      minHeight: '100%',
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '60px 0 0',
    }}>
      {/* Sheet */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -12px 40px rgba(15,23,42,0.25)',
        display: 'flex', flexDirection: 'column',
        flex: 1, minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Grabber */}
        <div style={{
          width: 40, height: 4, borderRadius: 4,
          background: 'var(--border-default)',
          margin: '8px auto 4px',
        }}/>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 0',
        }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--text-special)' }}>Round 1 · Live</div>
            <div style={{ font: 'var(--t-h3)', fontWeight: 700, letterSpacing: '-0.015em' }}>Score entries</div>
          </div>
          <button style={{
            width: 32, height: 32, borderRadius: 999,
            border: 0, background: 'var(--bg-surface-sunken)',
            color: 'var(--text-muted)',
            display: 'grid', placeItems: 'center',
            fontSize: 16,
          }} aria-label="Close">×</button>
        </div>

        {/* Entry chips */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          padding: '14px 16px 4px', scrollbarWidth: 'none',
        }}>
          {entries.map((e, i) => (
            <button key={i} onClick={() => setActiveEntry(i)} style={{
              flex: '0 0 auto',
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid ' + (i === activeEntry ? 'var(--c-slate-900)' : 'var(--border-subtle)'),
              background: i === activeEntry ? 'var(--c-slate-900)' : 'var(--bg-surface)',
              color: i === activeEntry ? '#fff' : 'var(--text-default)',
              fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {i + 1}. {e.name}
            </button>
          ))}
        </div>

        {/* Active entry card */}
        <div style={{ padding: '12px 16px 0' }}>
          <div className="surface" style={{
            padding: 14,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--c-amber-400), var(--c-amber-600))',
              flex: '0 0 auto',
            }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{entries[activeEntry].name}</div>
              <div className="muted" style={{ fontSize: 13 }}>by {entries[activeEntry].maker}</div>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div style={{
          padding: '14px 16px 4px',
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {cats.map(c => (
            <ScoreSlider
              key={c.id}
              label={c.label}
              value={scores[c.id]}
              onChange={v => setScores(s => ({ ...s, [c.id]: v }))}
            />
          ))}
        </div>

        {/* Submit bar — sticky at bottom */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: 12 }}>Total</div>
            <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.015em' }}>
              {Object.values(scores).reduce((a, b) => a + b, 0)}
              <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}> / 30</span>
            </div>
          </div>
          <button className="btn btn--primary" style={{ flex: '0 0 auto' }}>
            Next entry →
          </button>
        </div>
      </div>
    </div>
  );
};

const ScoreSlider = ({ label, value, onChange }) => {
  return (
    <div>
      <div className="row row--between" style={{ marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
        <span style={{
          font: 'var(--t-h4)', fontWeight: 700, letterSpacing: '-0.015em',
          color: 'var(--text-strong)',
          fontVariantNumeric: 'tabular-nums',
        }}>{value}<span className="muted" style={{ fontSize: 12, fontWeight: 500 }}> / 10</span></span>
      </div>
      <input
        type="range"
        min="0" max="10" step="1"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="score-slider"
        style={{ width: '100%' }}
      />
      <div className="row row--between" style={{ marginTop: 4, fontSize: 11, color: 'var(--text-subtle)' }}>
        <span>Poor</span>
        <span>Average</span>
        <span>Excellent</span>
      </div>
    </div>
  );
};

window.VoteSheet = VoteSheet;

// One-shot global slider styling (matches our cyan accent).
if (typeof document !== 'undefined' && !document.getElementById('vote-slider-style')) {
  const s = document.createElement('style');
  s.id = 'vote-slider-style';
  s.textContent = `
    .score-slider { -webkit-appearance: none; appearance: none; height: 28px; background: transparent; }
    .score-slider:focus { outline: none; }
    .score-slider::-webkit-slider-runnable-track {
      height: 8px; border-radius: 999px;
      background: linear-gradient(90deg, var(--c-cyan-500) 0 var(--p, 50%), var(--bg-surface-sunken) var(--p, 50%) 100%);
    }
    .score-slider::-moz-range-track {
      height: 8px; border-radius: 999px; background: var(--bg-surface-sunken);
    }
    .score-slider::-moz-range-progress {
      height: 8px; border-radius: 999px; background: var(--c-cyan-500);
    }
    .score-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 24px; height: 24px; border-radius: 50%;
      background: #fff; border: 2px solid var(--c-cyan-500);
      margin-top: -8px;
      box-shadow: 0 1px 4px rgba(15,23,42,0.2);
      cursor: pointer;
    }
    .score-slider::-moz-range-thumb {
      width: 24px; height: 24px; border-radius: 50%;
      background: #fff; border: 2px solid var(--c-cyan-500);
      box-shadow: 0 1px 4px rgba(15,23,42,0.2); cursor: pointer;
    }
  `;
  document.head.appendChild(s);
}

// Sync the gradient track fill with value on every change
document.addEventListener('input', e => {
  if (e.target.classList && e.target.classList.contains('score-slider')) {
    const v = (e.target.value - e.target.min) / (e.target.max - e.target.min) * 100;
    e.target.style.setProperty('--p', v + '%');
  }
});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.score-slider').forEach(el => {
    const v = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.setProperty('--p', v + '%');
  });
});
