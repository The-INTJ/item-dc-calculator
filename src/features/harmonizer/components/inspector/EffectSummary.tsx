import { content } from '../../content';
import type { EffectDescriptor } from '../../domain/analysis-types';
import styles from './CandidateInspector.module.scss';

interface EffectSummaryProps {
  descriptors: EffectDescriptor[];
}

/** Labels and explanations only — numeric descriptor values never surface here (spec §15.13). */
export function EffectSummary({ descriptors }: EffectSummaryProps) {
  if (descriptors.length === 0) return null;
  return (
    <div className={styles.effect}>
      <span className={styles.effectHeading}>{content.inspector.effectHeading}:</span>
      <ul className={styles.effectList}>
        {descriptors.map((descriptor) => (
          <li key={descriptor.id}>
            <strong>{descriptor.label}</strong> — {descriptor.explanation}
          </li>
        ))}
      </ul>
    </div>
  );
}
