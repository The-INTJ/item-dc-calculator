import React, { useState, useEffect } from 'react';

function LoadItemModal({ isOpen, onClose, handleItemLoad }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  function fetchItems() {
    fetch('http://localhost:3000/load-items')
      .then(response => response.json())
      .then(data => {
        console.log('Fetched items:', data);
        setItems(data);
      })
      .catch(error => console.error('Error fetching items:', error));
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
              <button onClick={() => handleItemClick(item)}>
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
