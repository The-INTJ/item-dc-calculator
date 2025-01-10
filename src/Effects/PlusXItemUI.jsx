// /Effects/PlusXItemUI.js

import React from 'react';
import { ValueInput, IsArmorCheckbox } from './Common';

/**
 * +X Item effect requires:
 * - value (numeric)
 * - isArmor (boolean)
 */
function PlusXItemUI({ effect, onEffectFieldChange }) {
  return (
    <div className="+x-item-ui">
      <ValueInput
        label="+X Value"
        value={effect.value || 0}
        onChange={(val) => onEffectFieldChange('value', val)}
      />
      <IsArmorCheckbox
        value={effect.isArmor || false}
        onChange={(val) => onEffectFieldChange('isArmor', val)}
      />
    </div>
  );
}

export default PlusXItemUI;
