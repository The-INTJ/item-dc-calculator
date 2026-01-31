'use client';

import { useEffect, useMemo, useState } from 'react';
import type { VoteCategory } from '../../types';
import { buildDefaultVoteCategories } from '../ui/voteUtils';

interface ContestCategoriesProps {
  contestId: string;
  initialCategories?: VoteCategory[];
}

type Status = 'idle' | 'saving' | 'success' | 'error';

export function ContestCategories({ contestId, initialCategories = [] }: ContestCategoriesProps) {
  const [categories, setCategories] = useState<VoteCategory[]>(initialCategories);
  const [selectedId, setSelectedId] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const availableCategories = useMemo(() => {
    const usedIds = new Set(categories.map((category) => category.id));
    return buildDefaultVoteCategories().filter((category) => !usedIds.has(category.id));
  }, [categories]);

  const handleAdd = async () => {
    if (!selectedId) return;
    const template = availableCategories.find((category) => category.id === selectedId);
    if (!template) return;

    setStatus('saving');
    setMessage(null);

    try {
      const response = await fetch(`/api/mixology/contests/${contestId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mixology-role': 'admin',
        },
        body: JSON.stringify({
          id: template.id,
          label: template.label,
          description: template.description,
          sortOrder: categories.length,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? 'Failed to add category.');
      }

      setCategories(payload.categories ?? []);
      setSelectedId('');
      setStatus('success');
      setMessage('Category added.');
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
  };

  const handleRemove = async (categoryId: string) => {
    setStatus('saving');
    setMessage(null);

    try {
      const response = await fetch(`/api/mixology/contests/${contestId}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'x-mixology-role': 'admin' },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? 'Failed to remove category.');
      }

      setCategories(payload.categories ?? []);
      setStatus('success');
      setMessage('Category removed.');
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
  };

  return (
    <section className="admin-details-section">
      <h3>Vote categories</h3>
      <div className="admin-category-form">
        <select
          className="admin-category-form__select"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">Select a category</option>
          {availableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="button-secondary"
          onClick={handleAdd}
          disabled={!selectedId || status === 'saving'}
        >
          Add category
        </button>
      </div>

      {message && (
        <p className={`admin-category-form__message admin-category-form__message--${status}`}>
          {message}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="admin-empty">No categories configured.</p>
      ) : (
        <ul className="admin-detail-list">
          {categories.map((category) => (
            <li key={category.id} className="admin-detail-item">
              <strong>{category.label}</strong>
              <span className="admin-detail-meta">{category.id}</span>
              <button
                type="button"
                className="button-secondary"
                onClick={() => handleRemove(category.id)}
                disabled={status === 'saving'}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
