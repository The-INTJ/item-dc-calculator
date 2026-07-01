import type { ReactNode } from 'react';
import { guidingConvictions } from '../lib/content';
import styles from './HeritageHymnsDemo.module.scss';

function StaticShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <article className={styles.staticPage}>
      <header className={styles.staticHeader}>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </header>
      {children ? <div className={styles.staticProse}>{children}</div> : null}
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

export function HymnalsTab() {
  return <StaticShell eyebrow="Hymnals" title="Hymnals" />;
}

export function ConnectTab() {
  return <StaticShell eyebrow="Connect" title="Connect" />;
}

export function DonateTab() {
  return (
    <StaticShell eyebrow="Support the Work" title="Help Sustain This Ministry of Song">
      <p>
        The preparation and publication of a hymnal is a labor that extends far beyond the printed
        page. From planning, design, and engraving to licensing, production, and distribution, each
        volume represents the work of many hands and many hours of thoughtful stewardship.
      </p>
      <p>
        As a non-profit ministry, Heritage Hymnal Company is grateful for the generosity of churches
        and individuals who value faithful congregational singing and desire to place rich hymnody
        into the hands of others.
      </p>

      <section>
        <h2>Share in This Work</h2>
        <p>
          If you have benefited from this ministry or desire to see the church continue singing these
          treasures of the faith, we invite you to share in this work by making a tax-deductible gift.
          Your gift may help:
        </p>
        <ul className={styles.donateUseList}>
          <li>offset production and licensing expenses</li>
          <li>make hymnals available to churches and individuals with limited means</li>
          <li>support the continued publication of faithful hymnals</li>
        </ul>
      </section>

      <p>
        Thank you for partnering with us in this labor. Your support helps ensure that the church's
        tradition of congregational song is preserved for generations yet unborn.
      </p>
      <blockquote>
        <p>
          This shall be written for the generation to come: and the people which shall be created
          shall praise the LORD.
        </p>
        <cite>Psalm 102:18</cite>
      </blockquote>
    </StaticShell>
  );
}
