import type { ReactNode } from 'react';

import { porticoTitles, type PorticoPage } from '../routes';
import { Architrave } from './Architrave';
import { CalendarPage } from './CalendarPage';
import { Columns } from './Columns';
import { ContactPage } from './ContactPage';
import { FaithPage } from './FaithPage';
import { Foundation } from './Foundation';
import { Gable } from './Gable';
import { HomeInterior } from './HomeInterior';
import { PastorPage } from './PastorPage';
import styles from './Portico.module.scss';
import { SermonsPage } from './SermonsPage';
import { Threshold } from './Threshold';

/** Every page body, keyed by `?page=`. */
const PAGES: Record<PorticoPage, () => ReactNode> = {
  home: () => (
    <>
      <Threshold />
      <HomeInterior />
    </>
  ),
  pastor: () => <PastorPage />,
  faith: () => <FaithPage />,
  sermons: () => <SermonsPage />,
  calendar: () => <CalendarPage />,
  contact: () => <ContactPage />,
};

/**
 * The Portico preview of moriahpbc.org: every page stands under Moriah's own
 * porch — its gable for a header, its two columns along the sides, its steps
 * and footing for a floor.
 */
export function PorticoDemo({ page }: { page: PorticoPage }) {
  const Body = PAGES[page];

  return (
    <div className={styles.portico} key={page}>
      <Gable title={page === 'home' ? undefined : porticoTitles[page]} />
      <Architrave current={page} />
      <main className={styles.porch}>
        <Columns />
        <Body />
      </main>
      <Foundation />
    </div>
  );
}
