import type { Contest, Matchup } from '@/contest/contexts/contest/contestTypes';
import { buildDisplayModel } from '@/contest/lib/presentation/displayModel';
import { DisplayBracket } from './DisplayBracket';

interface ContestDisplayProps {
  contest: Contest;
  matchups: Matchup[];
}

export function ContestDisplay({ contest, matchups }: ContestDisplayProps) {
  const model = buildDisplayModel(contest, matchups);

  return (
    <div className="contest-display-page">
      <DisplayBracket model={model} />
    </div>
  );
}
