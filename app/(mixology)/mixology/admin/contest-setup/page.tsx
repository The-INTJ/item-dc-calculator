import { ContestSetupForm } from '@/contest/components/admin/ContestSetupForm';

export const metadata = {
  title: 'Create Contest | Admin Dashboard',
  description: 'Create a new contest with template selection.',
};

export default function ContestSetupPage() {
  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1>Create New Contest</h1>
        <p>Set up a new contest by choosing a name and template.</p>
      </header>
      <main className="admin-main">
        <ContestSetupForm />
      </main>
    </div>
  );
}
