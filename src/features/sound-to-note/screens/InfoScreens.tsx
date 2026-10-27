import Image from 'next/image';

import { GearItem, QuotePhotoCard, SocialLink } from '../components/cards/cards';
import { Button } from '../components/ui/Button';
import { PhotoFrame, SectionHeader, Sticker, Tag } from '../components/ui/primitives';
import { gear, quotes, socials } from '../content';
import { stnHref } from '../routes';
import cards from '../styles/cards.module.scss';
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
            {group.note && <p className={cards.gearNote}>{group.note}</p>}
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
            Hi, I&apos;m Alex, your friendly international production sound mixer. Sound is my
            passion.
          </p>
          <p>
            I hold a master&apos;s in music composition and audio technology, with a minor in
            physics, but the degree isn&apos;t the point. I love this job: capturing performances,
            and the unique places every project takes me.
          </p>
          <p>
            Beyond capturing the moment, my biggest focus is organization. I move with the flow of
            production and post, and I work with crew and producers so it&apos;s always clear what
            sound needs. Streamlined and easy, for everyone.
          </p>
          <p>
            Off the clock, I play in the disco-funk band Shugah Munny (find us on Spotify) and run
            sound on the YouTube series <em>Elder Eye Hooligans</em>.
          </p>
          <div>
            <Button href={stnHref('contact')}>Book Alex</Button>
          </div>
        </div>
      </div>
      <section className={s.quoteWall}>
        <SectionHeader eyebrow="Word on set" title="From the people I work with" />
        <div className={s.quotes}>
          {quotes.map((quote, i) => (
            <QuotePhotoCard key={i} quote={quote} />
          ))}
        </div>
      </section>
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
