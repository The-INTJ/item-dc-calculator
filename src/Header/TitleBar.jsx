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
  const [saveClass, setSaveClass] = useState('');

  // Open/close the "Load Item" modal
  function handleOpenModal() {
    setIsModalOpen(true);
  }
  function handleCloseModal() {
    setIsModalOpen(false);
  }

  async function reactToSave() {
    const response = await handleSave();
    if (response.status === 200) {
      setSaveClass('success');
      // unset it after 1 second
      setTimeout(() => {
        setSaveClass('');
      }, 1000);
    } else {
      setSaveClass('fail');
      // unset it after 1 second
      setTimeout(() => {
        setSaveClass('');
      }, 1000);
    }
  }

  return (
    <div className="title-bar">
      {/* Left: Load Button */}
      <div className="title-bar-left">
        <button onClick={handleOpenModal}>Load</button>
      </div>

        <h1 className="dc-display">
          Final DC: {finalDC.toFixed(2)}
        </h1>

        <button className={'save-btn ' + saveClass} onClick={reactToSave}>Save</button>

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
