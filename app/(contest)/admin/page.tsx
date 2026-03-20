import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/contest/lib/api/serverAuth';
import { AdminDashboard } from '@/contest/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard | Contest App',
  description: 'Contest management, configuration, and scoring administration.',
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/onboard');
  }

  if (user.role !== 'admin') {
    redirect('/');
  }

  return <AdminDashboard />;
}
