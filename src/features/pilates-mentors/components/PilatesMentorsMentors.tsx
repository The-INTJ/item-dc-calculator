import Image from 'next/image';

import { mentors } from '../content';
import styles from './PilatesMentorsDemo.module.scss';

export function PilatesMentorsMentors() {
  return (
    <section
      id="mentors"
      className={`${styles.band} ${styles.mentorsBand}`}
      aria-labelledby="pm-mentors-heading"
    >
      <div className={styles.container}>
        <span className={styles.eyebrow}>{mentors.eyebrow}</span>
        <h2 id="pm-mentors-heading" className={styles.h2}>
          {mentors.headline}
        </h2>
        <div className={styles.mentorGrid}>
          {mentors.people.map((person) => (
            <article key={person.name} className={styles.mentorCard}>
              <Image
                src={person.image.src}
                alt={person.image.alt}
                width={1200}
                height={810}
                sizes="(max-width: 700px) 100vw, 50vw"
                className={styles.mentorPhoto}
              />
              <h3 className={styles.mentorName}>{person.name}</h3>
              <p className={styles.mentorRole}>{person.role}</p>
              <p className={styles.mentorLine}>{person.line}</p>
            </article>
          ))}
        </div>
        <dl className={styles.statRow}>
          {mentors.stats.map((stat) => (
            <div key={stat.label}>
              <dt className={styles.statLabel}>{stat.label}</dt>
              <dd className={styles.statValue}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
