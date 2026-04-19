import Link from 'next/link';
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
];

export default function PortalPage() {
  return (
    <div className={styles.portal}>
      <header className={styles.header}>
        <h1>Experiments</h1>
        <p>Pick an experience.</p>
      </header>
      <ul className={styles.list}>
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
