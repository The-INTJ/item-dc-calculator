import { MoriahDirectory } from '@/features/moriah';

export const metadata = {
  title: 'Church Directory — Moriah Primitive Baptist Church',
  description: 'Sample household directory for Moriah Primitive Baptist Church.',
  robots: { index: false, follow: false },
};

export default function MoriahDirectoryPage() {
  return <MoriahDirectory />;
}
