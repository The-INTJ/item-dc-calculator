'use client';

import type { ContestConfig } from '../../contexts/contest/contestTypes';

interface ContestConfigPreviewProps {
  config: ContestConfig;
  footerMessage?: string;
}

export function ContestConfigPreview({
  config,
  footerMessage,
}: ContestConfigPreviewProps) {
  return (
    <div className="admin-contest-setup-form__preview">
      <p>
        <strong>Topic:</strong> {config.topic}
      </p>
      <p>
        <strong>Entry type:</strong> {config.entryLabel ?? 'Entry'} /{' '}
        {config.entryLabelPlural ?? 'Entries'}
      </p>
      <h4>Scoring Attributes ({config.attributes.length})</h4>
      <ul className="admin-detail-list">
        {config.attributes.map((attribute) => (
          <li key={attribute.id} className="admin-detail-item">
            <strong>{attribute.label}</strong>
            <span className="admin-detail-meta"> ({attribute.id})</span>
            {attribute.description ? (
              <span className="admin-detail-meta"> - {attribute.description}</span>
            ) : null}
            <span className="admin-detail-meta">
              {' '}Range: {attribute.min ?? 0}-{attribute.max ?? 10}
            </span>
          </li>
        ))}
      </ul>
      {footerMessage ? <p className="admin-detail-meta">{footerMessage}</p> : null}
    </div>
  );
}
