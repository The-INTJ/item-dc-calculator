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
      <IsArmorCheckbox
        value={effect.universal || false}
        onChange={(val) => onEffectFieldChange('universal', val)}
      />
    </div>
  );
}

export default PlusXItemUI;
