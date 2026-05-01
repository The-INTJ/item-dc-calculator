// AppShell.jsx — header used in mobile contest screens

const AppShell = ({ title = 'Home', actions, children, scrollable = true, dark = false }) => {
  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--bg-page)',
      color: 'var(--text-strong)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        background: 'var(--bg-shell)',
        color: '#fff',
        padding: '14px var(--layout-page-pad-mobile) 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <span style={{ font: 'var(--t-h4)', fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {actions || (
            <>
              <ShellNavLink>Account</ShellNavLink>
              <ShellNavLink>Admin</ShellNavLink>
            </>
          )}
        </div>
      </header>
      <main style={{
        flex: 1,
        padding: 'var(--space-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--gap-stack)',
      }}>
        {children}
      </main>
    </div>
  );
};

const Logo = () => (
  <div style={{
    width: 26, height: 26, borderRadius: 7,
    background: 'linear-gradient(135deg, var(--c-cyan-400), var(--c-cyan-600))',
    display: 'grid', placeItems: 'center',
    color: '#011217', fontWeight: 800, fontSize: 13,
    letterSpacing: '-0.04em',
  }}>C</div>
);

const ShellNavLink = ({ children, active }) => (
  <button style={{
    height: 32, padding: '0 12px', borderRadius: 999,
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
    border: '1px solid rgba(255,255,255,0.16)',
    color: '#fff', fontSize: 13, fontWeight: 500,
  }}>{children}</button>
);

window.AppShell = AppShell;
window.Logo = Logo;
window.ShellNavLink = ShellNavLink;
