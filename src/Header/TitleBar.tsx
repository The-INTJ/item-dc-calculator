import React, { useState } from 'react';
import './header.scss';          
import LoadItemModal from './LoadItemModal';
import { Button } from '@mui/material';

type TitleBarProps = {
  finalDC: number;
  handleSave: () => Promise<any>;
  handleItemLoad: (item: { name: string; effectsArray: any[] }) => void;
};

function TitleBar({ finalDC, handleSave, handleItemLoad }: TitleBarProps) {
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
        <Button onClick={handleOpenModal} variant='outlined'>Load</Button>
      </div>

        <h1 className="dc-display">
          Final DC: {finalDC.toFixed(2)}
        </h1>

        <Button variant='outlined' className={'save-btn ' + saveClass} onClick={reactToSave}>Save</Button>

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
