import type { ReactNode } from 'react';
import './dc-calculator.scss';

export const metadata = {
  title: 'DC Calculator',
  description: 'Item DC calculator experience maintained alongside the mixology contest.',
};

export default function DcCalculatorGroupLayout({ children }: { children: ReactNode }) {
  return <main className="site-main">{children}</main>;
}
