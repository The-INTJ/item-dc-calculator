import App from '@/src/App';
import { AppShell } from '../components/AppShell';

export const metadata = {
  title: 'Item DC Calculator',
  description: 'Original item DC calculator experience preserved alongside the mixology contest.',
};

export default function LegacyCalculatorPage() {
  return (
    <AppShell currentApp="calculator">
      <App />
    </AppShell>
  );
}
