import React, { useState } from 'react';
import './header.scss';          
import LoadItemModal from './LoadItemModal';

/**
 * Displays the Final DC and provides "Load" and "Save" buttons.
 *
 * Props:
 *   finalDC (number): The calculated DC to display
 *   effectsArray (array): The array of current effects the user wants to save
 */
function TitleBar({ finalDC, handleSave, handleItemLoad }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open/close the "Load Item" modal
  function handleOpenModal() {
    setIsModalOpen(true);
  }
  function handleCloseModal() {
    setIsModalOpen(false);
  }

  return (
    <div className="title-bar">
      {/* Left: Load Button */}
      <div className="title-bar-left">
        <button onClick={handleOpenModal}>Load</button>
      </div>

      {/* Center: Final DC Display */}
      <h1 className="dc-display">
        Final DC: {finalDC.toFixed(2)}
      </h1>


      <button onClick={handleSave}>Save</button>

      {/* LoadItemModal: Hidden unless isModalOpen = true */}
      <LoadItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        handleItemLoad={handleItemLoad}
      />
    </div>
  );
}

export default TitleBar;
