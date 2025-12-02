import { useState } from 'react';
import { GeneralEffectUIProps } from './Common';
import TextField from '@mui/material/TextField';
import { Typography } from '@mui/material';

function Description({effect, onEffectFieldChange}: GeneralEffectUIProps) {
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const Editable = () => {
    return isEditingDescription ? (
      <TextField
        className="editable-description"
        value={effect.description}
        onChange={(e) => onEffectFieldChange('description', e.target.value)}
        onBlur={() => setIsEditingDescription(false)}
        autoFocus
      />
    ) : (
      <Typography className="editable-description" onClick={() => setIsEditingDescription(true)} onFocus={() => setIsEditingDescription(true)}>
        {effect.description || 'Your lack of description is disturbing...'}
      </Typography>
    );
}

    return (
        <div className="description">
            <Editable />
        </div>
    );
}

export default Description;
