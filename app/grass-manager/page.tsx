import type { Metadata } from 'next';

import { GrassManagerView } from '@/features/grass-manager/components/GrassManagerView';

export const metadata: Metadata = {
  title: 'Grass Manager | Drew Taylor',
  description: 'A weather-aware care plan for a real, uneven yard.',
};

export default function GrassManagerPage() {
  return <GrassManagerView />;
}
