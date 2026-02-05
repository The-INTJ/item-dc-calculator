interface VotePageHeaderProps {
  title?: string;
}

export function VotePageHeader({ title = 'Tally your tastes' }: VotePageHeaderProps) {
  return (
    <header className="contest-vote-header">
      <h1 className="contest-vote-header__title">{title}</h1>
    </header>
  );
}
