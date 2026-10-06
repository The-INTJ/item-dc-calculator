import { contact, heroFacts, projects, quotes } from '../content';
import { QuoteCard } from '../components/cards/cards';
import { ProjectCard } from '../components/cards/ProjectCard';
import { Button } from '../components/ui/Button';
import { Icon, PhotoFrame, SectionHeader, Sticker } from '../components/ui/primitives';
import { stnHref } from '../routes';
import s from '../styles/screens.module.scss';
import typo from '../styles/type.module.scss';

function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.heroCopy}>
        <span className={`${typo.label} ${s.live}`}>
          <span className={s.recDot} aria-hidden="true" />
          <span>{contact.role}</span>
          <span>· {contact.location}</span>
        </span>
        <h1 className={`${typo.display} ${typo.hero}`}>
          Clean audio.
          <br />
          <span className={typo.gradWarm}>Good hang.</span>
        </h1>
        <p className={typo.lead} style={{ maxWidth: '44ch' }}>
          I&apos;m Alex Ferré. For 7 years I&apos;ve made sure people can actually hear your actors,
          as part of a sound team or as a one-man band who wires, booms and mixes all at once.
        </p>
        <div className={s.buttons}>
          <Button size="lg" href={stnHref('contact')}>
            Book Alex
          </Button>
          <Button size="lg" variant="secondary" href={stnHref('work')}>
            See the work
          </Button>
        </div>
        <dl className={s.facts}>
          {heroFacts.map(([label, value]) => (
            <div key={label}>
              <dt className={typo.label}>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <PhotoFrame
        label="Hero — Alex on set with boom"
        ratio="4/5"
        caption={<Sticker tilt={-1.5}>yes, I&apos;m holding this for 12 hours</Sticker>}
      />
    </section>
  );
}

export function HomeScreen() {
  return (
    <>
      <Hero />
      <section className={s.section}>
        <div className={s.headRow}>
          <SectionHeader eyebrow="01 — The work" title="Recent credits" />
          <Button
            variant="ghost"
            href={stnHref('work')}
            iconRight={<Icon name="arrow-right" size={16} />}
          >
            All projects
          </Button>
        </div>
        <div className={s.cards}>
          {projects.slice(0, 3).map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
      <section className={s.section}>
        <SectionHeader eyebrow="02 — Word on set" title="Don't take my word for it" />
        <div className={s.quotes}>
          {quotes.map((quote, i) => (
            <QuoteCard key={i} quote={quote} />
          ))}
        </div>
      </section>
      <section className={s.band}>
        <h2 className={`${typo.display} ${typo.h1}`}>Got a shoot?</h2>
        <p className={typo.lead}>Tell me where, when and what. I&apos;ll get back to you fast.</p>
        <Button size="lg" href={stnHref('contact')}>
          Book Alex
        </Button>
      </section>
    </>
  );
}
