import { content } from '../../content';
import type { AnalysisEvidence, CandidatePath } from '../../domain/analysis-types';
import type { MelodyFragment } from '../../domain/music-types';
import { roleTermIds, solfegeTermId } from '../../knowledge/glossary';
import { pitchDisplay } from '../shared/format';
import { MarkedText } from '../shared/MarkedText';
import { Term } from '../shared/Term';
import styles from './CandidateInspector.module.scss';

interface AnalysisDrawerProps {
  candidate: CandidatePath;
  fragment: MelodyFragment;
  open: boolean;
  onToggle: () => void;
}

/** Generic evidence renderer — works for any source (computed/rule/corpus/curated/user). */
function EvidenceList({ evidence }: { evidence: AnalysisEvidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <ul className={styles.evidenceList}>
      {evidence.map((entry) => (
        <li key={entry.id} className={styles.evidenceItem}>
          <span className={styles.evidenceSource}>{content.evidenceSources[entry.source]}</span>
          <span className={styles.evidenceText}>
            <MarkedText text={entry.explanation ?? entry.featureId} />
          </span>
          <span className={styles.evidenceProvider}>
            {entry.featureId} · {entry.providerId}@{entry.providerVersion}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AnalysisDrawer({ candidate, fragment, open, onToggle }: AnalysisDrawerProps) {
  return (
    <div className={styles.drawer}>
      <button
        type="button"
        className={styles.drawerToggle}
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? content.inspector.hideEvidence : content.inspector.showEvidence}
      </button>
      {open ? (
        <div className={styles.drawerBody}>
          {candidate.melodyInterpretations.map((interpretation) => {
            const melodyEvent = fragment.events.find(
              (event) => event.id === interpretation.melodyEventId,
            );
            const roleTermId = roleTermIds[interpretation.role];
            return (
              <section key={interpretation.melodyEventId} className={styles.drawerSection}>
                <h4 className={styles.drawerEventHeading}>
                  {melodyEvent ? (
                    <Term
                      termId={solfegeTermId}
                      variant="chip"
                      className={styles.drawerSyllable}
                    >
                      {melodyEvent.scaleDegree.syllable}
                    </Term>
                  ) : (
                    <span className={styles.drawerSyllable}>
                      {interpretation.melodyEventId}
                    </span>
                  )}
                  {melodyEvent ? (
                    <span className={styles.drawerPitch}>{pitchDisplay(melodyEvent.pitch)}</span>
                  ) : null}
                  {/* unclassified/ambiguous are honest non-claims — no term. */}
                  <span className={styles.roleBadgeSlot}>
                    {roleTermId ? (
                      <Term termId={roleTermId} variant="chip" className={styles.roleBadge}>
                        {content.melodyRoles[interpretation.role]}
                      </Term>
                    ) : (
                      <span className={styles.roleBadge}>
                        {content.melodyRoles[interpretation.role]}
                      </span>
                    )}
                  </span>
                </h4>
                <p className={styles.drawerExplanation}>
                  <MarkedText text={interpretation.explanation} />
                </p>
                <EvidenceList evidence={interpretation.evidence} />
              </section>
            );
          })}
          {candidate.evidence.length > 0 ? (
            <section className={styles.drawerSection}>
              <h4 className={styles.drawerEventHeading}>
                <span className={styles.drawerPitch}>{content.inspector.candidateEvidence}</span>
              </h4>
              <EvidenceList evidence={candidate.evidence} />
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
