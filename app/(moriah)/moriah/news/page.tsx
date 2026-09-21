import { MoriahNews } from '@/features/moriah';

export const metadata = {
  title: 'News & Calendar — Moriah Primitive Baptist Church',
  description: 'Announcements and the church calendar for Moriah Primitive Baptist Church.',
  robots: { index: false, follow: false },
};

export default function MoriahNewsPage() {
  return <MoriahNews />;
}
