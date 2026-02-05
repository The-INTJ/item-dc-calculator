'use client';

/**
 * AttributeEditor - Dynamic editor for contest scoring attributes.
 * Allows add/edit/remove/reorder of AttributeConfig items.
 */

import { useCallback } from 'react';
import type { AttributeConfig } from '../../lib/globals';

interface AttributeEditorProps {
  attributes: AttributeConfig[];
  onChange: (attributes: AttributeConfig[]) => void;
  disabled?: boolean;
}

function generateAttributeId(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^[^a-z]/, 'attr_');
}

function createEmptyAttribute(): AttributeConfig {
  return { id: '', label: '', description: '', min: 0, max: 10 };
}

export function AttributeEditor({ attributes, onChange, disabled }: AttributeEditorProps) {
  const handleAdd = useCallback(() => {
    onChange([...attributes, createEmptyAttribute()]);
  }, [attributes, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(attributes.filter((_, i) => i !== index));
    },
    [attributes, onChange]
  );

  const handleChange = useCallback(
    (index: number, field: keyof AttributeConfig, value: string | number) => {
      const updated = attributes.map((attr, i) => {
        if (i !== index) return attr;
        const newAttr = { ...attr, [field]: value };
        // Auto-generate ID from label if ID is empty or was auto-generated
        if (field === 'label' && (!attr.id || attr.id === generateAttributeId(attr.label))) {
          newAttr.id = generateAttributeId(value as string);
        }
        return newAttr;
      });
      onChange(updated);
    },
    [attributes, onChange]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const updated = [...attributes];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      onChange(updated);
    },
    [attributes, onChange]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === attributes.length - 1) return;
      const updated = [...attributes];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onChange(updated);
    },
    [attributes, onChange]
  );

  return (
    <div className="admin-attribute-editor">
      <div className="admin-attribute-editor__list">
        {attributes.map((attr, index) => (
          <AttributeRow
            key={index}
            attribute={attr}
            index={index}
            isFirst={index === 0}
            isLast={index === attributes.length - 1}
            disabled={disabled}
            onChange={handleChange}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}
      </div>
      <button
        type="button"
        className="button-secondary"
        onClick={handleAdd}
        disabled={disabled}
      >
        Add Attribute
      </button>
    </div>
  );
}

interface AttributeRowProps {
  attribute: AttributeConfig;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  onChange: (index: number, field: keyof AttributeConfig, value: string | number) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function AttributeRow({
  attribute,
  index,
  isFirst,
  isLast,
  disabled,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: AttributeRowProps) {
  return (
    <div className="admin-attribute-row">
      <div className="admin-attribute-row__reorder">
        <button
          type="button"
          className="admin-attribute-row__move"
          onClick={() => onMoveUp(index)}
          disabled={disabled || isFirst}
          aria-label="Move up"
        >
          ▲
        </button>
        <button
          type="button"
          className="admin-attribute-row__move"
          onClick={() => onMoveDown(index)}
          disabled={disabled || isLast}
          aria-label="Move down"
        >
          ▼
        </button>
      </div>
      <div className="admin-attribute-row__fields">
        <input
          type="text"
          className="admin-rounds-input"
          value={attribute.label}
          onChange={(e) => onChange(index, 'label', e.target.value)}
          placeholder="Label (e.g. Creativity)"
          disabled={disabled}
          required
        />
        <input
          type="text"
          className="admin-rounds-input admin-attribute-row__id"
          value={attribute.id}
          onChange={(e) => onChange(index, 'id', e.target.value)}
          placeholder="ID"
          disabled={disabled}
          required
        />
        <input
          type="text"
          className="admin-rounds-input"
          value={attribute.description ?? ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Description (optional)"
          disabled={disabled}
        />
        <div className="admin-attribute-row__range">
          <input
            type="number"
            className="admin-rounds-input admin-attribute-row__number"
            value={attribute.min ?? 0}
            onChange={(e) => onChange(index, 'min', parseInt(e.target.value, 10) || 0)}
            placeholder="Min"
            disabled={disabled}
            min={0}
          />
          <span>–</span>
          <input
            type="number"
            className="admin-rounds-input admin-attribute-row__number"
            value={attribute.max ?? 10}
            onChange={(e) => onChange(index, 'max', parseInt(e.target.value, 10) || 10)}
            placeholder="Max"
            disabled={disabled}
            min={1}
          />
        </div>
      </div>
      <button
        type="button"
        className="admin-attribute-row__remove"
        onClick={() => onRemove(index)}
        disabled={disabled}
        aria-label="Remove attribute"
      >
        ✕
      </button>
    </div>
  );
}
