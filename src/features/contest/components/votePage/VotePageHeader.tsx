interface VotePageHeaderProps {
  title?: string;
}

export function VotePageHeader({ title = 'Tally your tastes' }: VotePageHeaderProps) {
  return (
    <header className="mixology-vote-header">
      <h1 className="mixology-vote-header__title">{title}</h1>
    </header>
  );
}
