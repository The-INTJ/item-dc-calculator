'use client';

/**
 * ContestIdentityFields - The contest's name and URL slug: state (with
 * slug auto-derivation from the name) plus the two form fields.
 */

import React, { useCallback, useState } from 'react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function useContestIdentity() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextName = event.target.value;
      setName(nextName);
      if (!slugManuallyEdited) {
        setSlug(slugify(nextName));
      }
    },
    [slugManuallyEdited],
  );

  const handleSlugChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(event.target.value));
    setSlugManuallyEdited(true);
  }, []);

  return { name, slug, handleNameChange, handleSlugChange };
}

export function ContestIdentityFields({
  identity,
}: {
  identity: ReturnType<typeof useContestIdentity>;
}) {
  return (
    <>
      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-name">Contest Name</label>
        <input
          id="contest-name"
          type="text"
          className="admin-rounds-input"
          value={identity.name}
          onChange={identity.handleNameChange}
          placeholder="e.g. Summer Dessert Showdown"
          required
        />
      </div>

      <div className="admin-contest-setup-form__field">
        <label htmlFor="contest-slug">URL Slug</label>
        <input
          id="contest-slug"
          type="text"
          className="admin-rounds-input"
          value={identity.slug}
          onChange={identity.handleSlugChange}
          placeholder="e.g. summer-contest-2026"
          required
        />
        <span className="admin-detail-meta">Auto-generated from name. Edit to customize.</span>
      </div>
    </>
  );
}
