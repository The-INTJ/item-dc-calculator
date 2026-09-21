import { MoriahBeliefs, MoriahHistory } from './MoriahBeliefs';
import { MoriahFooter, MoriahHeader } from './MoriahChrome';
import styles from './MoriahDemo.module.scss';
import { MoriahHero, MoriahTimes } from './MoriahHero';
import { MoriahPastor } from './MoriahPastor';
import { MoriahVisit } from './MoriahVisit';
import { MoriahWelcome } from './MoriahWelcome';
import { SermonLibrary } from './SermonLibrary';

/**
 * Design preview of a refreshed moriahpbc.org homepage. Server-rendered
 * apart from the sermon library, which owns the search state.
 */
export function MoriahDemo() {
  return (
    <div className={styles.page}>
      <MoriahHeader />
      <main>
        <MoriahHero />
        <MoriahTimes />
        <MoriahWelcome />
        <SermonLibrary />
        <MoriahPastor />
        <MoriahBeliefs />
        <MoriahHistory />
        <MoriahVisit />
      </main>
      <MoriahFooter />
    </div>
  );
}
