import type { Metadata, Viewport } from 'next';

import { DonutsView } from '@/donuts/components';

export const metadata: Metadata = {
  title: 'Sunday Donuts',
  description: 'Whose turn it is to bring donuts for Sunday-morning breakfast.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function DonutsPage() {
  return <DonutsView />;
}
