import { useState, useEffect } from 'react';
import { db } from '../server';
import { Effect } from '../values';

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
        <h2>Load an Item</h2>
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              <button className='item' onClick={() => handleItemClick(item)}>
                {item.name || `Item ${index + 1}`}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default LoadItemModal;
