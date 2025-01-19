const saveFilePath = './saveFile.txt';

export async function saveEffectsToFile(effects) {
    const response = await fetch('http://localhost:3000/save-effects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(effects),
    });

    if (!response.ok) {
        throw new Error('Failed to save effects');
    }

    console.log('Effects saved to file:', saveFilePath);
}

export async function loadEffectsFromFile() {
    const response = await fetch('http://localhost:3000/load-effects', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to load effects');
    }

    const effects = await response.json();
    console.log('Effects loaded from file:', effects);
    return effects;
}