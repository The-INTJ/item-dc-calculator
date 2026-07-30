import { Fragment } from 'react';
import { isTermId } from '../../knowledge/glossary';
import { parseMarkedText } from '../../knowledge/markup/parse';
import { Term } from './Term';
import styles from './Term.module.scss';

interface MarkedTextProps {
  text: string;
  /**
   * Inside an open tip panel: render term references as link-styled buttons
   * that swap the panel content in place instead of opening nested popovers.
   */
  onTermActivate?: (termId: string) => void;
}

/**
 * Renders marked prose: plain segments as text, `[term]` segments as hoverable
 * Terms (or in-panel links when onTermActivate is provided). Unknown ids have
 * already degraded to plain text in parseMarkedText.
 */
export function MarkedText({ text, onTermActivate }: MarkedTextProps) {
  return (
    <>
      {parseMarkedText(text).map((segment, index) => {
        if (segment.kind === 'text') {
          return <Fragment key={index}>{segment.text}</Fragment>;
        }
        if (onTermActivate) {
          return (
            <button
              key={index}
              type="button"
              className={styles.inlineTermLink}
              onClick={(event) => {
                event.stopPropagation();
                onTermActivate(segment.termId);
              }}
            >
              {segment.display}
            </button>
          );
        }
        if (!isTermId(segment.termId)) {
          return <Fragment key={index}>{segment.display}</Fragment>;
        }
        return (
          <Term key={index} termId={segment.termId}>
            {segment.display}
          </Term>
        );
      })}
    </>
  );
}
