'use client';

import { useState } from 'react';
import { GRASS_LABELS, seasonalNote, treatmentNote, weedAdvice, SOURCES } from '../lib/lawnCare';
import type { CareEvent, GrassProfile, WeatherSnapshot } from '../lib/types';
import { GrassProfileForm } from './GrassProfileForm';
import styles from './GrassManagerView.module.scss';

interface Props {
  profile: GrassProfile; events: CareEvent[]; today: string; weather: WeatherSnapshot | null;
  onChange: (patch: Partial<GrassProfile>) => void;
}

function WeedRow({ name, profile, today }: { name: string; profile: GrassProfile; today: string }) {
  const advice = weedAdvice(name, profile, today);
  return <div className={styles.weedRow}>
    <strong>{advice.name}<span>{advice.action}</span></strong>
    <div><p>{advice.note}</p>
      <details className={styles.weedTiming}><summary>When & why</summary>
        {advice.timing && <p>{advice.timing}</p>}<a href={advice.source} target="_blank" rel="noreferrer">Extension guidance ↗</a>
      </details>
    </div>
  </div>;
}

export function LawnGuide({ profile, events, today, weather, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const showForm = editing || !profile.configured;
  return (
    <section className={styles.lawnCard} aria-labelledby="lawn-heading">
      <header className={styles.cardHeading}>
        <div><h2 id="lawn-heading">Your lawn</h2>{profile.configured && !showForm && <span className={styles.subtle}>{GRASS_LABELS[profile.grassType]}</span>}</div>
        {!showForm && <button type="button" className={styles.textButton} onClick={() => setEditing(true)}>Edit profile</button>}
      </header>
      {showForm ? <GrassProfileForm profile={profile} onSave={(patch) => { onChange(patch); setEditing(false); }} onCancel={profile.configured ? () => setEditing(false) : undefined} /> : (
        <>
          <div className={styles.weedList}>
            {profile.weedTypes.slice(0, 3).map((name) => <WeedRow key={name} name={name} profile={profile} today={today} />)}
            {!profile.weedTypes.length && <p className={styles.quiet}>Add the weeds you recognize in Edit profile for a removal plan.</p>}
            {profile.weedTypes.length > 3 && <details className={styles.subDetails}><summary>{profile.weedTypes.length - 3} more weeds</summary>
              {profile.weedTypes.slice(3).map((name) => <WeedRow key={name} name={name} profile={profile} today={today} />)}
            </details>}
          </div>
          <p className={styles.seasonNote}><strong>Seasonal</strong>{seasonalNote(profile, today)}</p>
          <p className={styles.treatmentNote}>{treatmentNote(profile, events, today, weather)}</p>
          <a className={styles.sourceLink} href={SOURCES.weeds} target="_blank" rel="noreferrer">Product label overrides this guide ↗</a>
        </>
      )}
    </section>
  );
}
