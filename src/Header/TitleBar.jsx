// TitleBar.jsx

import React, { useState } from 'react';
import './header.scss';          // <-- New SCSS import
import LoadItemModal from './LoadItemModal';

/**
 * Displays the Final DC and provides "Load" and "Save" buttons.
 *
 * Props:
 *   finalDC (number): The calculated DC to display
 *   onSave (function): Handler for saving the item
 */
function TitleBar({ finalDC, onSave, onLoad }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
  }

  function handleSaveClick() {
    if (onSave) {
      onSave();
    }
  }

  return (
    <div className="title-bar">
      {/* Left: Load Button */}
      <div className="title-bar-left">
        <button onClick={handleOpenModal}>Load</button>
      </div>

      {/* Center: Final DC Title */}
      <h1 className="dc-display">
        Final DC: {finalDC.toFixed(2)}
      </h1>

      {/* Right: Save Button */}
      <div className="title-bar-right">
        <button onClick={handleSaveClick}>Save</button>
      </div>

      {/* The Modal for loading an item (hidden if !isModalOpen) */}
      <LoadItemModal isOpen={isModalOpen} onClose={handleCloseModal} onLoad={onLoad} />
    </div>
  );
}

export default TitleBar;
