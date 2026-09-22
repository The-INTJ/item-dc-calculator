import Link from 'next/link';
import { PlantExperienceCard } from '@/plants/components';
import styles from './page.module.scss';

export const metadata = {
  title: 'Experiments | Drew Taylor',
  description: 'Entry point for the experiences hosted on this site.',
};

interface Experience {
  title: string;
  description: string;
  href: string;
}

const experiences: Experience[] = [
  {
    title: 'Contest App',
    description:
      'Judging, scoring, and display mode for live mixology competitions.',
    href: '/contests',
  },
  {
    title: 'DC Calculator',
    description: 'Legacy item DC calculator for tabletop sessions.',
    href: '/dc-calculator',
  },
  {
    title: 'Grass Manager',
    description: 'Weather-aware lawn care, a clickable yard map, and a care log.',
    href: '/grass-manager',
  },
  {
    title: 'Sunday Donuts',
    description: 'Whose turn it is to bring donuts for Sunday-morning breakfast.',
    href: '/donuts',
  },
  {
    title: 'Hymn Harmonization Workbench',
    description: 'Audition four-part harmonizations of a hymn melody fragment (UI proof of concept).',
    href: '/harmonizer',
  },
];

export default function PortalPage() {
  return (
    <div className={styles.portal}>
      <header className={styles.header}>
        <h1>Experiments</h1>
        <p>Pick an experience.</p>
      </header>
      <ul className={styles.list}>
        <li>
          <PlantExperienceCard
            title="Plant Tracker"
            description="Watering, fertilizer, notes, vibe checks, and replanting cycles."
            classNames={{
              card: styles.card,
              title: styles.cardTitle,
              description: styles.cardDescription,
            }}
          />
        </li>
        {experiences.map((experience) => (
          <li key={experience.href}>
            <Link href={experience.href} className={styles.card}>
              <span className={styles.cardTitle}>{experience.title}</span>
              <span className={styles.cardDescription}>{experience.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
