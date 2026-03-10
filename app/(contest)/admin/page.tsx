import { AdminDashboard } from '@/contest/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | Contest App',
  description: 'Contest management, configuration, and scoring administration.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
