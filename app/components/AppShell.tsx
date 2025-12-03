import type { ReactNode } from 'react';
import type { AppExperience } from './NavBar';
import { NavBar } from './NavBar';

type AppShellProps = {
  currentApp: AppExperience;
  children: ReactNode;
};

export function AppShell({ currentApp, children }: AppShellProps) {
  return (
    <>
      <NavBar currentApp={currentApp} />
      <main className="site-main">{children}</main>
    </>
  );
}
