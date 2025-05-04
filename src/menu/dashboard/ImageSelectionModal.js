import React from 'react';
import './ImageSelectionModal.css';
import images from './imageUtils'; 
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../Firebase'; 

const ImageSelectionModal = ({ email,isOpen, onClose, onSelect}) => {
  if (!isOpen) return null;

  const handleImageClick = async (key) => {
    onSelect(key.toString());

    // Save the selected image in Firestore  
    const playerDocRef = doc(db, 'players', email);
    await updateDoc(playerDocRef, { profilePic: key.toString() });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Select Profile Picture</h2>
        <div className="ImageSelection">
          {Object.keys(images).map((key) => (
            <img
              key={key}
              src={images[key]}
              alt={key}
              className="SelectableImage"
              onClick={() => handleImageClick(key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSelectionModal;