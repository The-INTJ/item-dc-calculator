import type { ReactNode } from 'react';

import { pageTitles, type PageKey } from '../content';
import { ChurchCalendar } from './ChurchCalendar';
import { DirectoryCards } from './DirectoryCards';
import { MoriahBeliefs, MoriahHistory } from './MoriahBeliefs';
import { MoriahFooter, MoriahHeader } from './MoriahChrome';
import { MoriahConnect } from './MoriahConnect';
import styles from './MoriahDemo.module.scss';
import { MoriahHero, MoriahTimes } from './MoriahHero';
import { MoriahNews } from './MoriahNews';
import { MoriahPastor } from './MoriahPastor';
import { MoriahBlog, MoriahGive } from './MoriahPlaceholderPages';
import { MoriahVisit } from './MoriahVisit';
import { MoriahWelcome } from './MoriahWelcome';
import { PageHeading } from './PageHeading';
import { SermonLibrary } from './SermonLibrary';

/**
 * Every page body, keyed by `?page=`. Keeping them in a map rather than a
 * switch keeps this module flat and makes the route list readable at a glance.
 */
const PAGES: Record<PageKey, () => ReactNode> = {
  home: () => (
    <>
      <MoriahHero />
      <MoriahTimes />
      <MoriahWelcome />
      <MoriahConnect />
    </>
  ),
  sermons: () => <SermonLibrary />,
  blog: () => <MoriahBlog />,
  pastor: () => <MoriahPastor />,
  beliefs: () => (
    <>
      <MoriahBeliefs />
      <MoriahHistory />
    </>
  ),
  news: () => <MoriahNews />,
  directory: () => (
    <PageHeading page="directory">
      <DirectoryCards />
    </PageHeading>
  ),
  visit: () => (
    <>
      <MoriahVisit />
      <MoriahConnect />
    </>
  ),
  give: () => <MoriahGive />,
};

/**
 * Design preview of a refreshed moriahpbc.org. One route; `?page=` picks the
 * body, so the nav navigates for real instead of scrolling to an anchor.
 */
export function MoriahDemo({ page }: { page: PageKey }) {
  const Body = PAGES[page];

  return (
    <div className={styles.page} key={page}>
      <MoriahHeader current={page} />
      <main>
        <Body />
      </main>
      <MoriahFooter />
    </div>
  );
}

export { pageTitles };
