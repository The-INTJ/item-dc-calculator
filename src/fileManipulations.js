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