import { useState } from 'react';
import './Effects.scss';
import { Effect } from '../values';

type DescriptionProps = {
  effect: Effect;
  onEffectFieldChange: (field: string, value: any) => void;
};

function Description({effect, onEffectFieldChange}: DescriptionProps) {
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const Editable = () => {
    return isEditingDescription ? (
      <input
        className="editable-description"
        value={effect.description}
        onChange={(e) => onEffectFieldChange('description', e.target.value)}
        onBlur={() => setIsEditingDescription(false)}
        autoFocus
      />
    ) : (
      <p className="editable-description" onClick={() => setIsEditingDescription(true)} onFocus={() => setIsEditingDescription(true)}>
        {effect.description || 'Your lack of description is disturbing...'}
      </p>
    );
}

    return (
        <div className="description">
            <Editable />
        </div>
    );
}

export default Description;
