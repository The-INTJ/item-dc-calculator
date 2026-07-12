import type { Metadata, Viewport } from 'next';

import { PlantAccessBoundary, PlantsView } from '@/plants/components';

export const metadata: Metadata = {
  title: 'Plant Tracker | Drew Taylor',
  description:
    'Track watering, fertilizer, notes, vibe checks, and replanting cycles for your plants.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PlantsPage() {
  return (
    <PlantAccessBoundary>
      <PlantsView />
    </PlantAccessBoundary>
  );
}
