import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';

const app = express();
const port = 3000;

// Create and initialize the database
const db = await JSONFilePreset('db.json', { items: [] });

app.use(cors());
app.use(express.json());

// -----------------------------------
// Save (Create/Update) an item by name
// -----------------------------------
app.post('/save-item', async (req, res) => {
  const { name, effectsArray } = req.body;

  await db.update(({ items }) => {
    // Check if the item already exists
    const existingItemIndex = items.findIndex((item) => item.name === name);

    if (existingItemIndex >= 0) {
      // Update existing item
      items[existingItemIndex].effectsArray = effectsArray;
    } else {
      // Add new item
      items.push({ name, effectsArray });
    }
  });

  res.sendStatus(200);
});

// -----------------------------------
// Load all items
// -----------------------------------
app.get('/load-items', async (req, res) => {
  const { items } = db.data;
  res.json(items);
});

// (Optional) Load a single item by name
app.get('/load-item/:name', async (req, res) => {
  const { name } = req.params;
  const { items } = db.data;

  const item = items.find((item) => item.name === name);
  if (!item) {
    return res.status(404).send('Item not found');
  }

  res.json(item);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
