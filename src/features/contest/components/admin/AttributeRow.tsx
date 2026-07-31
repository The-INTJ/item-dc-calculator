'use client';

import type { AttributeConfig } from '../../contexts/contest/contestTypes';

type FieldChange = (index: number, field: keyof AttributeConfig, value: string | number) => void;

interface AttributeRowProps {
  attribute: AttributeConfig;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  onChange: FieldChange;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

/** Attribute order is the order voters see the sliders in, so it is editable. */
function ReorderButtons({
  index,
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
}: Pick<AttributeRowProps, 'index' | 'isFirst' | 'isLast' | 'disabled' | 'onMoveUp' | 'onMoveDown'>) {
  return (
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
  );
}

/** The score range a voter's slider spans for this attribute. */
function RangeInputs({
  attribute,
  index,
  disabled,
  onChange,
}: Pick<AttributeRowProps, 'attribute' | 'index' | 'disabled' | 'onChange'>) {
  return (
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
  );
}

export function AttributeRow({
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
      <ReorderButtons
        index={index}
        isFirst={isFirst}
        isLast={isLast}
        disabled={disabled}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
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
        <RangeInputs
          attribute={attribute}
          index={index}
          disabled={disabled}
          onChange={onChange}
        />
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
