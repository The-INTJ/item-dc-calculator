import { useState, useEffect } from 'react';
import { db } from '../server';
import { Effect } from '../values';
import { getNearestShardColor } from '../values';
import { Button, Typography } from '@mui/material';

type Item = {
  name: string;
  effectsArray: Effect[];
};

type LoadItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  handleItemLoad: (item: Item) => void;
};

function LoadItemModal({ isOpen, onClose, handleItemLoad }: LoadItemModalProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  async function fetchItems() {
    try {
      const response = await db.loadAllItems();
      if (response.status === 200) {
        setItems(response.items);
      } else {
        console.error('Uknown error fetching items', response.status);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  if (!isOpen) {
    return null;
  }

  function handleItemClick(item: Item) {
    handleItemLoad(item);  // Pass the entire item (name + effects) back up
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Typography component="h2" size="large">Load an Item</Typography>
        <div className='item-list-in-modal'>
          {items.map((item, index) => {
            const styleObject = getNearestShardColor(item.effectsArray);
            return (
              <button 
                key={index} 
                className={`item ${styleObject.willShine ? 'shine' : ''}`}
                style={{background: styleObject.background}}
                onClick={() => handleItemClick(item)}
              >
                {item.name || `Item ${index + 1}`}
              </button>
            );
          })}
        </div>
        <Button variant='contained' onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export default LoadItemModal;
