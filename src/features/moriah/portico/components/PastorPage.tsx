import Image from 'next/image';

import { pastorPage, siteLabels } from '../content';
import { Inscription } from './Inscription';
import { PanelLink } from './PanelLink';
import { PastorMessage } from './PastorMessage';
import styles from './PastorPage.module.scss';
import room from './Room.module.scss';

/** The pastor and his wife, in a painted frame, with the site's own caption. */
function Portrait() {
  return (
    <section className={styles.portrait} aria-labelledby="mo2-pastor-name">
      <figure className={styles.figure}>
        <span className={styles.frame}>
          <Image
            src={pastorPage.photo.src}
            alt={pastorPage.photo.alt}
            width={552}
            height={414}
            sizes="(max-width: 719px) 88vw, 440px"
            className={styles.photo}
            priority
          />
        </span>
        <figcaption className={styles.caption}>{pastorPage.caption}</figcaption>
      </figure>
      <div className={styles.opening}>
        <h2 id="mo2-pastor-name" className={styles.name}>
          {pastorPage.name}
        </h2>
        {pastorPage.opening.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}

function Ministry() {
  const { ministry } = pastorPage;
  return (
    <section className={room.room} aria-labelledby="mo2-ministry">
      <Inscription id="mo2-ministry">{ministry.title}</Inscription>
      <div className={room.prose}>
        {ministry.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className={room.quiet}>{ministry.pearlLead}</p>
      <p className={room.big}>{ministry.pearl}</p>
      <p className={room.ref}>{ministry.pearlRef}</p>
      <PanelLink href={ministry.listenHref} external>
        {siteLabels.listen}
      </PanelLink>
    </section>
  );
}

function Vision() {
  const { vision } = pastorPage;
  return (
    <section className={room.room} aria-labelledby="mo2-vision-page">
      <Inscription id="mo2-vision-page">{vision.title}</Inscription>
      <div className={room.prose}>
        {vision.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className={room.statement}>{vision.well}</p>
      <p className={room.quiet}>{vision.need}</p>
      <blockquote className={styles.prayer}>
        <p>{vision.prayer}</p>
      </blockquote>
    </section>
  );
}

/** "Pictured below" — so the photograph sits below those words, as on his page. */
function Fathers() {
  const { fathers } = pastorPage;
  return (
    <section className={room.room} aria-labelledby="mo2-fathers">
      <Inscription id="mo2-fathers">{fathers.title}</Inscription>
      <div className={room.prose}>
        {fathers.intro.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <figure className={styles.fathers}>
        <span className={styles.frame}>
          <Image
            src={fathers.photo.src}
            alt={fathers.photo.alt}
            width={640}
            height={480}
            sizes="(max-width: 719px) 88vw, 620px"
            className={styles.photo}
          />
        </span>
        <figcaption className={styles.pair}>
          <p>{fathers.left}</p>
          <p>{fathers.right}</p>
        </figcaption>
      </figure>
      <div className={room.prose}>
        {fathers.closing.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}

/** Elder Bryson's page on moriahpbc.org, whole and in his words, in its own order. */
export function PastorPage() {
  return (
    <>
      <Portrait />
      <Ministry />
      <Vision />
      <PastorMessage />
      <Fathers />
    </>
  );
}
