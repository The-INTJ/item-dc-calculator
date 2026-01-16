import { VoteClient } from './VoteClient';

export const metadata = {
  title: 'Voting | Mixology Rating App',
  description: 'Voting flow for Mixology voters.',
};

export default function MixologyVotePage() {
  return <VoteClient />;
}
