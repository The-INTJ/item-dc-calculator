'use client';

/**
 * AttributeEditor - Dynamic editor for contest scoring attributes.
 * Allows add/edit/remove/reorder of AttributeConfig items.
 */

import { useCallback } from 'react';
import type { AttributeConfig } from '../../contexts/contest/contestTypes';
import {
  createEmptyAttribute,
  generateAttributeId,
} from '../../lib/domain/contestConfigDraft';

interface AttributeEditorProps {
  attributes: AttributeConfig[];
  onChange: (attributes: AttributeConfig[]) => void;
  disabled?: boolean;
}

export function AttributeEditor({ attributes, onChange, disabled }: AttributeEditorProps) {
  const handleAdd = useCallback(() => {
    onChange([...attributes, createEmptyAttribute()]);
  }, [attributes, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(attributes.filter((_, itemIndex) => itemIndex !== index));
    },
    [attributes, onChange],
  );

  const handleChange = useCallback(
    (index: number, field: keyof AttributeConfig, value: string | number) => {
      const updated = attributes.map((attribute, itemIndex) => {
        if (itemIndex !== index) {
          return attribute;
        }

        const nextAttribute = { ...attribute, [field]: value };
        if (
          field === 'label' &&
          (!attribute.id || attribute.id === generateAttributeId(attribute.label))
        ) {
          nextAttribute.id = generateAttributeId(value as string);
        }

        return nextAttribute;
      });

      onChange(updated);
    },
    [attributes, onChange],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) {
        return;
      }

      const updated = [...attributes];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      onChange(updated);
    },
    [attributes, onChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === attributes.length - 1) {
        return;
      }

      const updated = [...attributes];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onChange(updated);
    },
    [attributes, onChange],
  );

  return (
    <div className="admin-attribute-editor">
      <div className="admin-attribute-editor__list">
        {attributes.map((attribute, index) => (
          <AttributeRow
            key={index}
            attribute={attribute}
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
          ^
        </button>
        <button
          type="button"
          className="admin-attribute-row__move"
          onClick={() => onMoveDown(index)}
          disabled={disabled || isLast}
          aria-label="Move down"
        >
          v
        </button>
      </div>
      <div className="admin-attribute-row__fields">
        <input
          type="text"
          className="admin-rounds-input"
          value={attribute.label}
          onChange={(event) => onChange(index, 'label', event.target.value)}
          placeholder="Label (e.g. Creativity)"
          disabled={disabled}
          required
        />
        <input
          type="text"
          className="admin-rounds-input admin-attribute-row__id"
          value={attribute.id}
          onChange={(event) => onChange(index, 'id', event.target.value)}
          placeholder="ID"
          disabled={disabled}
          required
        />
        <input
          type="text"
          className="admin-rounds-input"
          value={attribute.description ?? ''}
          onChange={(event) => onChange(index, 'description', event.target.value)}
          placeholder="Description (optional)"
          disabled={disabled}
        />
        <div className="admin-attribute-row__range">
          <input
            type="number"
            className="admin-rounds-input admin-attribute-row__number"
            value={attribute.min ?? 0}
            onChange={(event) => onChange(index, 'min', parseInt(event.target.value, 10) || 0)}
            placeholder="Min"
            disabled={disabled}
            min={0}
          />
          <span>-</span>
          <input
            type="number"
            className="admin-rounds-input admin-attribute-row__number"
            value={attribute.max ?? 10}
            onChange={(event) => onChange(index, 'max', parseInt(event.target.value, 10) || 10)}
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
        x
      </button>
    </div>
  );
}
