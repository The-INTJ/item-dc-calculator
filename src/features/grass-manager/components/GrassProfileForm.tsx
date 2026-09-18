import { grassTypeLabel } from '../lib/grassInsights';
import type { GrassProfile } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface GrassProfileFormProps {
  profile: GrassProfile;
  onChange: (patch: Partial<GrassProfile>) => void;
}

const GRASS_TYPES: GrassProfile['grassType'][] = [
  'mixed-unsure',
  'tall-fescue',
  'kentucky-bluegrass',
  'perennial-ryegrass',
  'bermuda',
  'zoysia',
  'st-augustine',
  'centipede',
];

export function GrassProfileForm({ profile, onChange }: GrassProfileFormProps) {
  return (
    <section className={styles.profileCard}>
      <div className={styles.cardHeading}><div><span className={styles.eyebrow}>Lawn profile</span><h2>Tell it what it is dealing with</h2></div></div>
      <label className={styles.field}><span>Grass type</span><select value={profile.grassType} onChange={(event) => onChange({ grassType: event.target.value as GrassProfile['grassType'] })}>{GRASS_TYPES.map((type) => <option key={type} value={type}>{grassTypeLabel(type)}</option>)}</select></label>
      <label className={styles.field}><span>Known weeds <small>comma separated</small></span><input value={profile.weedTypes.join(', ')} onChange={(event) => onChange({ weedTypes: event.target.value.split(',').map((weed) => weed.trim()).filter(Boolean).slice(0, 8) })} placeholder="crabgrass, clover, dandelion" /></label>
      <label className={styles.field}><span>Typical sprinkler pass <small>minutes before moving it</small></span><input type="number" min="5" max="120" value={profile.sprinklerMinutes} onChange={(event) => onChange({ sprinklerMinutes: Math.max(5, Math.min(120, Number(event.target.value) || 5)) })} /></label>
      <p className={styles.formHint}>The profile is saved in this browser. Use the zone map to override the default pass length where the hill or narrow strips need special treatment.</p>
    </section>
  );
}
