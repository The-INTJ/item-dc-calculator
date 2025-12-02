import React, { useState } from 'react';
import LoadItemModal from './LoadItemModal';
import { Button, Input, Typography } from '@mui/material';

type TitleBarProps = {
  finalDC: number;
  handleSave: () => Promise<any>;
  handleItemLoad: (item: { name: string; effectsArray: any[] }) => void;
  itemName: string;
  setItemName: (name: string) => void;
};

function TitleBar({ handleSave, handleItemLoad, itemName, setItemName, finalDC }: TitleBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveClass, setSaveClass] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

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

  function EditableTitle () {
    return isEditingTitle ? (
      <Input
        className="editable-title-input"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        onBlur={() => setIsEditingTitle(false)}
        autoFocus
        sx={{ fontSize: '2.5rem', color: 'white', textAlign: 'center' }}
      />
    ) : (
      <Typography 
        className="editable-title" 
        onClick={() => setIsEditingTitle(true)}
        component={'h1'}
        fontSize={'2.5rem'}
      >
        {itemName}
        <br />
        {finalDC}
      </Typography>
    )
  }

  return (
    <div className="title-bar">
      {/* Left: Load Button */}
      <div className="title-bar-left">
        <Button onClick={handleOpenModal} variant='text'>Load</Button>
      </div>

        <EditableTitle />

        <Button variant='text' className={'save-btn ' + saveClass} onClick={reactToSave}>Save</Button>

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
