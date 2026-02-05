'use client';

import type { AttributeConfig } from '../../contexts/contest/contestTypes';

interface ContestCategoriesProps {
  contestId: string;
  attributes?: AttributeConfig[];
}

/**
 * @deprecated This component is deprecated. Scoring attributes are now managed
 * via ContestConfigEditor through contest.config.attributes.
 */
export function ContestCategories({ attributes = [] }: ContestCategoriesProps) {
  return (
    <section className="admin-details-section">
      <h3>Scoring Attributes</h3>
      <p className="admin-detail-meta">
        Scoring attributes are now managed in the Contest Configuration section above.
      </p>
      {attributes.length === 0 ? (
        <p className="admin-empty">No attributes configured.</p>
      ) : (
        <ul className="admin-detail-list">
          {attributes.map((attr) => (
            <li key={attr.id} className="admin-detail-item">
              <strong>{attr.label}</strong>
              <span className="admin-detail-meta">{attr.id}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
