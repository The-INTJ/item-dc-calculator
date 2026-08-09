import type { Metadata, Viewport } from 'next';

import { DonutsAdminView } from '@/donuts/components';

/**
 * The admin path — unlisted rather than gated, which is the access model the
 * group asked for. `robots` keeps it out of search results.
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
