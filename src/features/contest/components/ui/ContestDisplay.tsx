import type { Contest } from '@/contest/contexts/contest/contestTypes';
import { buildDisplayModel } from '@/contest/lib/helpers/displayModel';
import { DisplayBracket } from './DisplayBracket';

interface ContestDisplayProps {
  contest: Contest;
}

export function ContestDisplay({ contest }: ContestDisplayProps) {
  const model = buildDisplayModel(contest);

  return (
    <div className="contest-display-page">
      <DisplayBracket model={model} />
    </div>
  );
}