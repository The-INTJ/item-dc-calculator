import express from 'express';
import fs from 'fs';
import cors from 'cors';

const app = express();
const port = 3000;
const saveFilePath = './saveFile.txt';

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.post('/save-effects', (req, res) => {
    const effects = req.body;
    const effectsJson = JSON.stringify(effects, null, 2);
    fs.writeFileSync(saveFilePath, effectsJson, 'utf8');
    res.sendStatus(200);
});

app.get('/load-effects', (req, res) => {
    if (fs.existsSync(saveFilePath)) {
        const effectsJson = fs.readFileSync(saveFilePath, 'utf8');
        const effects = JSON.parse(effectsJson);
        res.json(effects);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});