import { Button, SelectChangeEvent } from '@mui/material';
import { useEffect, useState } from 'react';

import EffectDetails from './Effects/EffectDetails';
import { calculateEffectDC } from './dcCalculations';
import { useEffectInfoContext } from './context/EffectInfoContext';
import { Effect, EffectType } from './values';

/**
 * Renders the correct UI for the chosen effectType.
 * 
 * Props:
 *   effect: the current effect object
 *   onEffectChange: function(index, fieldName, newValue)
 *   index: the index of this effect
 */
type EffectChangeHandler = <K extends keyof Effect>(
  index: number,
  fieldName: K,
  newValue: Effect[K]
) => void;

type EffectItemProps = {
  effect: Effect;
  onEffectChange: EffectChangeHandler;
  index: number;
};

function EffectItem({ effect, onEffectChange, index }: EffectItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeEffect, setActiveEffect } = useEffectInfoContext();

  useEffect(() => {
    if (isOpen) {
      if (
        activeEffect?.index !== index ||
        activeEffect.effectType !== effect.effectType
      ) {
        setActiveEffect({ index, effectType: effect.effectType });
      }
    } else if (activeEffect?.index === index) {
      setActiveEffect(null);
    }
  }, [activeEffect, effect.effectType, index, isOpen, setActiveEffect]);

  useEffect(() => () => {
    setActiveEffect((current) =>
      current?.index === index ? null : current
    );
  }, [index, setActiveEffect]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  function handleEffectTypeChange(e: SelectChangeEvent<EffectType>) {
    onEffectChange(index, 'effectType', e.target.value as EffectType);
  }

  function handleFieldChange<K extends keyof Effect>(fieldName: K, newValue: Effect[K]) {
    onEffectChange(index, fieldName, newValue);
  }

  const effectClassName = `effect-item ${effect.effectType
    .replace(/\s+/g, '-')
    .replace(/\+/g, '')
    .toLowerCase()}${isOpen ? ' open' : ''}`;

  return (
    <div className={effectClassName}>
      {isOpen ? (
        <>
          <EffectDetails
            effect={effect}
            onEffectFieldChange={handleFieldChange}
            onEffectTypeChange={handleEffectTypeChange}
            onCollapse={toggleOpen}
          />
        </>
      ) : (
        <Button onClick={toggleOpen} variant="outlined">
          <strong>
            {effect.effectType}: {calculateEffectDC(effect)}
          </strong>
        </Button>
      )}
    </div>
  );
}

export default EffectItem;
