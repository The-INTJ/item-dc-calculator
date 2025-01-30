import React, { useState } from 'react';
import './Effects.scss';

function Description({effect, onEffectFieldChange}) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const Editable = () => {
    return isEditingTitle ? (
      <input
        className="editable-title"
        value={effect.description}
        onChange={(e) => onEffectFieldChange('description', e.target.value)}
        onBlur={() => setIsEditingTitle(false)}
        autoFocus
      />
    ) : (
      <p className="editable-title" 
        onClick={() => setIsEditingTitle(true)} 
        onFocus={() => setIsEditingTitle(true)}
      >
        {effect.description || 'And some things that should not have been forgotten... were lost.'}
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
