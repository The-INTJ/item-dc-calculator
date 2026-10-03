export default function TracerGameLoading() {
  return (
    <main
      aria-busy="true"
      style={{ display: 'grid', placeItems: 'center', minHeight: '60dvh', color: 'var(--tr-muted)' }}
    >
      Setting up the board…
    </main>
  );
}
