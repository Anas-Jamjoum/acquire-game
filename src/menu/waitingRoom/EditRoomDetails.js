import React, { useState, useEffect } from 'react';
import { db } from '../../Firebase'; // Update the path to the correct location
import { doc, updateDoc } from 'firebase/firestore';
import './EditRoomDetails.css'; // Import the CSS file for styling

const EditRoomDetails = ({ isOpen, onClose, gameData, gameId }) => {
  const [gameName, setGameName] = useState(gameData.gameName);
  const [isPrivate, setIsPrivate] = useState(gameData.isPrivate);
  const [mode, setMode] = useState(gameData.mode);
  const [roomDescription, setRoomDescription] = useState(gameData.roomDescription);
  const [password, setPassword] = useState(gameData.password);
  const [roomNameError, setRoomNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset the state values when the modal is opened
      setGameName(gameData.gameName);
      setIsPrivate(gameData.isPrivate);
      setMode(gameData.mode);
      setRoomDescription(gameData.roomDescription);
      setPassword(gameData.password);
      setRoomNameError('');
      setPasswordError('');
    }
  }, [isOpen, gameData]);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'isPrivate') {
      setIsPrivate(checked);
    } else {
      switch (name) {
        case 'gameName':
          setGameName(value);
          break;
        case 'mode':
          setMode(value);
          break;
        case 'roomDescription':
          setRoomDescription(value);
          break;
        case 'password':
          setPassword(value);
          break;
        default:
          break;
      }
    }
  };


  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;

    if (!gameName.trim()) {
      setRoomNameError('Room name cannot be empty');
      hasError = true;
    } else {
      setRoomNameError('');
    }

    if (isPrivate && !password.trim()) {
      setPasswordError('Password cannot be empty for private rooms');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) {
      return;
    }

    const gameDocRef = doc(db, 'rooms', gameId);
    await updateDoc(gameDocRef, {
      gameName,
      isPrivate,
      mode,
      roomDescription,
      password: isPrivate ? password : '',
    });
    onClose();
  };

  if (!isOpen)

  return (
    <div className="EditRoomDetailsModal">
      <div className="EditRoomDetailsContent">
        <button className="CloseButton" onClick={onClose}>×</button>
        <h1>Edit Room Details</h1>
        <form onSubmit={handleFormSubmit}>
          <label className="InputLabel">
            Game Name:
            <input
              type="text"
              name="gameName"
              value={gameName}
              onChange={handleInputChange}
              placeholder="Enter Game Name"
              maxLength={20}
            />
            {roomNameError && <p className="ErrorMessage">{roomNameError}</p>}
          </label>
          <label className="InputLabel">
            Private:
            <select value={isPrivate} onChange={(e) => setIsPrivate(e.target.value === 'true')}>
                <option value="false">Public</option>
                <option value="true">Private</option>
              </select>
            {isPrivate && (
            <label className="InputLabel">
              Password:
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                placeholder="Enter password"
              />
              {passwordError && <p className="ErrorMessage">{passwordError}</p>}
            </label>
          )}
          </label>
          <label className="InputLabel">
            Mode:
            <select name="mode" value={mode} onChange={handleInputChange}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </label>
          <label className="InputLabel">
            Room Description:
            <textarea
              name="roomDescription"
              value={roomDescription}
              onChange={handleInputChange}
              placeholder="Enter Room Description"
              maxLength={50}
            />
          </label>
          <div className="ButtonGroup">
            <button type="submit" className="CreateButton">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomDetails;