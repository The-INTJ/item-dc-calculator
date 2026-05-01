// PhoneFrame.jsx — minimal phone bezel for mobile prototypes.
// Stays skinny so the design canvas can show many side-by-side.

const PhoneFrame = ({ width = 360, height = 740, children, theme, density, label, statusTime = '9:41' }) => {
  const frameStyle = {
    width: width + 12,
    height: height + 12,
    borderRadius: 44,
    background: '#0a0a0a',
    padding: 6,
    boxShadow: '0 30px 60px rgba(15,23,42,.18), 0 0 0 1px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.06)',
    position: 'relative',
  };
  const screenStyle = {
    width, height,
    borderRadius: 38,
    overflow: 'hidden',
    position: 'relative',
    background: theme === 'dark' ? '#020617' : '#f8fafc',
  };
  return (
    <div style={frameStyle} data-theme={theme} data-density={density}>
      <div style={screenStyle} className="phone-screen">
        <PhoneStatusBar time={statusTime} dark={theme === 'dark'} />
        <div style={{ height: height - 40, overflow: 'auto', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const PhoneStatusBar = ({ time, dark }) => (
  <div style={{
    height: 40,
    padding: '12px 26px 6px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    color: dark ? '#fff' : '#0f172a',
    fontSize: 13, fontWeight: 600,
    letterSpacing: '-0.01em',
    pointerEvents: 'none',
  }}>
    <span>{time}</span>
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {/* signal */}
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/>
        <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor"/>
        <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill="currentColor"/>
        <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/>
      </svg>
      {/* battery */}
      <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
        <rect x="0.5" y="0.5" width="20" height="10" rx="2" stroke="currentColor" opacity="0.4"/>
        <rect x="2" y="2" width="14" height="7" rx="1" fill="currentColor"/>
        <rect x="21.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4"/>
      </svg>
    </span>
  </div>
);

window.PhoneFrame = PhoneFrame;
