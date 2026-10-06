import Image from 'next/image';

import { GearItem, QuoteCard, SocialLink, TraitCard } from '../components/cards/cards';
import { Button } from '../components/ui/Button';
import { PhotoFrame, SectionHeader, Sticker, Tag } from '../components/ui/primitives';
import { gear, quotes, socials, traits } from '../content';
import { stnHref } from '../routes';
import s from '../styles/screens.module.scss';

export function GearScreen() {
  return (
    <div className={s.page} style={{ gap: 'var(--space-7)' }}>
      <div className={s.split}>
        <SectionHeader
          eyebrow="The gear"
          title="What's in the bag"
          lead="Professional kit I own and maintain. Model names for the sound folks, plain English for everyone else."
        />
        <PhotoFrame label="Gear spread — cart or bag flat-lay" ratio="3/2" />
      </div>
      <div className={s.gearGroups}>
        {gear.map((group) => (
          <section key={group.group}>
            <div className={s.gearHead}>
              <h3>{group.plainGroup}</h3>
              <Tag outline>{group.group}</Tag>
            </div>
            {group.items.map((item) => (
              <GearItem key={item.name} item={item} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export function AboutScreen() {
  return (
    <div className={s.page} style={{ gap: 'var(--space-8)' }}>
      <div className={s.about}>
        <PhotoFrame
          label="Portrait — Alex in action"
          ratio="4/5"
          caption={
            <Sticker tone="cyan" tilt={1.5}>
              also plays trombone
            </Sticker>
          }
        />
        <div className={s.aboutCopy}>
          <SectionHeader eyebrow="About" title="The guy you want on set" />
          <p className={s.aboutLead}>
            Hi, I&apos;m Alex. I&apos;m a production audio mixer with 7 years on features, series,
            commercials and docs.
          </p>
          <p>
            My job is to capture clean, organized audio so your editor never has to say
            &ldquo;we&apos;ll fix it in post.&rdquo; I work fast and I work hard, and directors tell
            me I&apos;m easy to be around for a 14-hour day.
          </p>
          <div>
            <Button href={stnHref('contact')}>Book Alex</Button>
          </div>
        </div>
      </div>
      <div className={s.traits}>
        {traits.map((trait) => (
          <TraitCard key={trait.title} trait={trait} />
        ))}
      </div>
      <QuoteCard quote={quotes[0]} size="lg" />
    </div>
  );
}

export function LinksScreen() {
  return (
    <div className={s.narrow}>
      <div className={s.linksHead}>
        <Image src="/sound-to-note/mark.png" alt="Sound To Note" width={164} height={120} />
        <SectionHeader center eyebrow="Find me" title="Links" />
      </div>
      <div className={s.stack}>
        {socials.map((entry) => (
          <SocialLink key={entry.label} entry={entry} />
        ))}
      </div>
    </div>
  );
}
