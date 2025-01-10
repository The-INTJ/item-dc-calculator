// LoadItemModal.jsx

import React from 'react';

/**
 * A simple modal to load items.
 *
 * Props:
 *   isOpen (boolean): Whether the modal is visible
 *   onClose (function): Close the modal
 */
function LoadItemModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Load an Item</h2>
        <p>[Placeholder for loading UI...]</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default LoadItemModal;
