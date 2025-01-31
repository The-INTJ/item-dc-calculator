import React, { useState, useEffect } from 'react';
import { db } from '../server';

function LoadItemModal({ isOpen, onClose, handleItemLoad }) {
  const [items, setItems] = useState([]);

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
        console.error('Error fetching items:', response.message);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  if (!isOpen) {
    return null;
  }

  function handleItemClick(item) {
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
