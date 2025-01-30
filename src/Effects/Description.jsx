import React, { useState } from 'react';
import './Effects.scss';

function Description(effect, onDescriptionChange) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const Editable = () => {
    return isEditingTitle ? (
      <input
        className="editable-title"
        value={effect.description}
        onChange={(e) => onDescriptionChange('description', e.target.value)}
        onBlur={() => setIsEditingTitle(false)}
        autoFocus
      />
    ) : (
      <p className="editable-title" onClick={() => setIsEditingTitle(true)} onFocus={() => setIsEditingTitle(true)}>
        {effect.description}
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
