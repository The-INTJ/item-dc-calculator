import { SiteShell } from '../components/shell/SiteShell';
import type { StnPage } from '../routes';
import { ContactScreen } from './ContactScreen';
import { HomeScreen } from './HomeScreen';
import { AboutScreen, GearScreen, LinksScreen } from './InfoScreens';
import { WorkScreen } from './WorkScreen';

export interface StnQuery {
  /** Work filter, already matched against the known project types. */
  type: string | null;
  /** Booking services to pre-check, as form labels. */
  services: string[];
}

/** Alex Ferré / Sound To Note resume site. `?page=` picks the body. */
export function SoundToNoteSite({ page, query }: { page: StnPage; query: StnQuery }) {
  const body = {
    home: () => <HomeScreen />,
    work: () => <WorkScreen type={query.type} />,
    gear: () => <GearScreen />,
    about: () => <AboutScreen />,
    links: () => <LinksScreen />,
    contact: () => <ContactScreen services={query.services} />,
  }[page];

  return <SiteShell page={page}>{body()}</SiteShell>;
}
