import type { Metadata, Viewport } from 'next';

import { DonutsAdminView } from '@/donuts/components';

/**
 * The canonical admin path. `app/[...donutsPath]/admin` serves the same view
 * from any other prefix (e.g. `/Dan/admin`); this explicit route exists because
 * Next.js resolves the static `donuts` segment before the root catch-all.
 */
export const metadata: Metadata = {
  title: 'Donut rotation admin',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function DonutsAdminPage() {
  return <DonutsAdminView />;
}
