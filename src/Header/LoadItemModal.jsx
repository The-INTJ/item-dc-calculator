// LoadItemModal.jsx

import React, { useState, useEffect } from 'react';

/**
 * A simple modal to load items.
 *
 * Props:
 *   isOpen (boolean): Whether the modal is visible
 *   onClose (function): Close the modal
 *   onLoad (function): Load the selected item
 */
function LoadItemModal({ isOpen, onClose, onLoad }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch items from the server when the modal opens
      fetchItems();
    }
  }, [isOpen]);

  function fetchItems() {
    fetch('http://localhost:3000/load-effects')
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
    onLoad(item);
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
                {`Item ${index + 1}`}
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
