import React from 'react';
import { Button, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

import values, { Effect, EffectType } from '../values';
import { Checkbox } from './Common';
import EffectSpecificFields from './EffectSpecificFields';
import Description from './Description';

type EffectDetailsProps = {
  effect: Effect;
  onEffectFieldChange: <K extends keyof Effect>(fieldName: K, value: Effect[K]) => void;
  onEffectTypeChange: (event: SelectChangeEvent<EffectType>) => void;
  onCollapse: () => void;
};

function EffectDetails({ effect, onEffectFieldChange, onEffectTypeChange, onCollapse }: EffectDetailsProps) {
  function outsideClassLabel(effectType: EffectType) {
    switch (effectType) {
      default:
        return 'Non-class ability?';
    }
  }

  return (
    <>
      <div className="effect-field">
        <InputLabel>Effect Type:</InputLabel>
        <Select value={effect.effectType} onChange={onEffectTypeChange} size="small">
          {Object.keys(values.effectBaseValues).map((effectKey) => (
            <MenuItem key={effectKey} value={effectKey}>
              {effectKey}
            </MenuItem>
          ))}
        </Select>
        <Checkbox
          label="Cursed?"
          value={effect.cursed}
          onChange={(val: boolean) => onEffectFieldChange('cursed', val)}
        />
        <Checkbox
          label="New Effect?"
          value={effect.isNew}
          onChange={(val: boolean) => onEffectFieldChange('isNew', val)}
        />
        <Checkbox
          label={outsideClassLabel(effect.effectType)}
          value={effect.outsideClass}
          onChange={(val: boolean) => onEffectFieldChange('outsideClass', val)}
        />
      </div>

      <EffectSpecificFields effect={effect} onEffectFieldChange={onEffectFieldChange} />

      <div className="spans-grid">
        <Description
          effect={effect}
          onEffectFieldChange={onEffectFieldChange}
        />
        <Button onClick={onCollapse}>Collapse</Button>
      </div>
    </>
  );
}

export default EffectDetails;
