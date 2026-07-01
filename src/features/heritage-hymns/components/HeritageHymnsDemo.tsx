'use client';

import {
  getHeritageTabHref,
  heritageTabs,
  normalizeHeritageTab,
  type HeritageTabId,
} from '../lib/tabs';
import { HomeTab } from './HomeTab';
import { HymnsBrowser } from './HymnsBrowser';
import {
  AboutTab,
  ConnectTab,
  DonateTab,
  HymnalsTab,
} from './StaticTabs';
import styles from './HeritageHymnsDemo.module.scss';

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function HeritageHeader({ activeTab }: { activeTab: HeritageTabId }) {
  return (
    <header className={styles.siteHeader}>
      <a href={getHeritageTabHref('home')} className={styles.brandMark} aria-label="Heritage Hymns">
        <span className={styles.fleuron} aria-hidden="true" />
        <span>
          <strong>Heritage</strong>
          <strong>Hymns</strong>
        </span>
      </a>
      <nav className={styles.mainNav} aria-label="Heritage Hymns sections">
        {heritageTabs
          .filter((tab) => tab.nav)
          .map((tab) => (
            <a
              href={getHeritageTabHref(tab.id)}
              key={tab.id}
              className={cx(tab.donate && styles.donateLink)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ))}
      </nav>
    </header>
  );
}

function ActiveTab({ activeTab }: { activeTab: HeritageTabId }) {
  if (activeTab === 'hymns') return <HymnsBrowser />;
  if (activeTab === 'hymnals') return <HymnalsTab />;
  if (activeTab === 'about') return <AboutTab />;
  if (activeTab === 'connect') return <ConnectTab />;
  if (activeTab === 'donate') return <DonateTab />;
  return <HomeTab />;
}

export function HeritageHymnsDemo({ initialTab = 'home' }: { initialTab?: HeritageTabId }) {
  const activeTab = normalizeHeritageTab(initialTab);

  return (
    <div className={styles.demoShell}>
      <HeritageHeader activeTab={activeTab} />
      <main className={styles.main}>
        <ActiveTab activeTab={activeTab} />
      </main>
    </div>
  );
}
