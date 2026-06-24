import type { ReactNode } from 'react';
import { forJackNotes, guidingConvictions } from '../lib/content';
import styles from './HeritageHymnsDemo.module.scss';

function StaticShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className={styles.staticPage}>
      <header className={styles.staticHeader}>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </header>
      <div className={styles.staticProse}>{children}</div>
    </article>
  );
}

export function AboutTab() {
  return (
    <StaticShell eyebrow="About Heritage Hymnal Company" title="Preserving a Legacy of Praise">
      <p>
        Founded in 2026, Heritage Hymnal Company exists to cultivate and share the rich treasury of
        congregational song entrusted to Christ's church. We believe hymns are living testimonies of
        biblical truth, shaped by generations of believers who have sung through seasons of joy and
        sorrow, faith and trial, thanksgiving and hope.
      </p>
      <p>
        Our desire is to place these treasures, old and new, into the hands of churches, families, and
        individual believers in a form both beautiful and useful: a hymnal that unites doctrinal depth
        with heartfelt devotion, teaching the mind and stirring the affections toward God.
      </p>
      <p>
        Our mission is to steward the church's rich musical heritage through hymnals that encourage
        congregational singing marked by theological fidelity, reverence, and joy.
      </p>

      <section>
        <h2>Treasures New & Old</h2>
        <p>
          Heritage Hymns reflects the conviction that faithful works from every era can and should
          stand together, united by biblical truth and a shared purpose: to exalt God and edify His
          people through song.
        </p>
        <blockquote>
          <p>
            Every scribe which is instructed unto the kingdom of heaven is like unto a man that is an
            householder, which bringeth forth out of his treasure things new and old.
          </p>
          <cite>Matthew 13:52</cite>
        </blockquote>
        <p>
          We cherish the rich, doctrinally deep hymns that have sustained believers through the
          centuries and joyfully receive recent hymns that have likewise enriched the worship of God's
          people.
        </p>
      </section>

      <section>
        <h2>Guiding Convictions</h2>
        <div className={styles.convictionGrid}>
          {guidingConvictions.map((conviction) => (
            <div key={conviction.title}>
              <h3>{conviction.title}</h3>
              <p>{conviction.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>The Song Continues</h2>
        <p>
          Our prayer is simple: that these hymns would not merely be preserved on a shelf, but sung.
          May they encourage family worship, strengthen congregational praise, teach biblical truth,
          comfort weary saints, and help a new generation join the great company of believers who
          have lifted their voices in praise to God through the ages.
        </p>
        <p>That is the legacy we hope to preserve in song.</p>
        <p>A legacy of praise.</p>
      </section>
    </StaticShell>
  );
}

export function ForJackTab() {
  return (
    <StaticShell eyebrow="Prototype Notes" title="For Jack">
      <p>
        Hey Jack! Some dev-oriented thoughts about this prototype are below.
      </p>

      <div className={styles.noteGrid}>
        {forJackNotes.map((note) => (
          <section key={note.title}>
            <h2>{note.title}</h2>
            <p>{note.body}</p>
          </section>
        ))}
      </div>

      <section>
        <h2>About coding tools</h2>
        <p>
          One practical thing worth knowing: tools like Claude Code and Codex may serve you well. A prior developer with strong opinions is
          exactly the kind of person these tools can help, because you can describe intent, review the
          result, and steer the next pass.
        </p>
        <p>
          This prototype, for example, was built almost entirely by directing an AI coding agent, without me looking at
          code more than once during the first pass, and that first-pass build took less than an hour.
          It costs me $20 /month :&#41;
          </p>
          <p>
          For you, and for true delivery, I think you'd need versions costing $100-$200 /month, but the point is that you can get a lot done with a small investment of time and money.
        </p>
      </section>
    </StaticShell>
  );
}

export function HymnalsTab() {
  return (
    <StaticShell eyebrow="Hymnals" title="Hymnal Orders">
      <p>
        The two primary features will be a browse/search/filter facility and hymnal orders. This
        prototype keeps orders as a quiet placeholder so the search and editorial direction can stay
        in focus.
      </p>
    </StaticShell>
  );
}

export function ConnectTab() {
  return (
    <StaticShell eyebrow="Connect" title="Connect">
      <p>
        Connect would gather the other ways to find, follow, subscribe to blog posts, and receive
        email news from Heritage Hymnal Company.
      </p>
    </StaticShell>
  );
}

export function DonateTab() {
  return (
    <StaticShell eyebrow="Donate" title="Help Preserve a Legacy of Praise">
      <p>
        The donation opportunity should feel tasteful and mission-supporting rather than loud. This
        prototype keeps Donate as a simple page instead of a full payment flow.
      </p>
    </StaticShell>
  );
}
