import { useState } from 'react';
import './Effects.scss';
import { GeneralEffectUIProps } from './Common';

function Description({effect, onEffectFieldChange}: GeneralEffectUIProps) {
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
