import Link from 'next/link';

import { ProjectCard } from '../components/cards/ProjectCard';
import { SectionHeader } from '../components/ui/primitives';
import { projects } from '../content';
import { projectTypes, stnHref, typeSlug } from '../routes';
import chip from '../styles/chip.module.scss';
import s from '../styles/screens.module.scss';

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`${chip.chip} ${chip.cyan} ${active ? chip.checked : ''}`}
    >
      <span className={chip.box} aria-hidden="true">
        {active ? '✓' : ''}
      </span>
      {label}
    </Link>
  );
}

/** Credits, filterable by type. The filter is `&type=`, so it can be linked to. */
export function WorkScreen({ type }: { type: string | null }) {
  const list = type ? projects.filter((p) => p.type === type) : projects;

  return (
    <div className={s.page}>
      <SectionHeader
        eyebrow="The work"
        title="Projects"
        lead="Who I worked with, where it landed, and the occasional story from set. Tap 'Behind the scenes' for the longer version."
      />
      <nav className={s.chips} aria-label="Filter by type">
        <FilterChip label="All" href={stnHref('work')} active={type === null} />
        {projectTypes.map((t) => (
          <FilterChip
            key={t}
            label={t}
            href={stnHref('work', { type: typeSlug(t) })}
            active={type === t}
          />
        ))}
      </nav>
      <div className={s.cards}>
        {list.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
