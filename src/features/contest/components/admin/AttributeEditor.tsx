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
import { AttributeRow } from './AttributeRow';

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
