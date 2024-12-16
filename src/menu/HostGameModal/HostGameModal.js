import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../Firebase'; // Update the path to the correct location
import { collection, addDoc } from 'firebase/firestore';
import './HostGameModal.css'; // Import the CSS file for styling

const HostGameModal = ({ isOpen, onClose }) => {
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [mode, setMode] = useState('online');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomNameError, setRoomNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Reset the state values when the modal is opened
      setRoomName('');
      setRoomDescription('');
      setMode('online');
      setIsPrivate(false);
      setPassword('');
      setIsRoomCreated(false);
      setRoomId('');
      setRoomNameError('');
      setPasswordError('');
    }
  }, [isOpen]);

  const handleCreateGame = async () => {
    let hasError = false;

    if (!roomName.trim()) {
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

    const user = auth.currentUser;
    if (user) {
      try {
        const roomDocRef = await addDoc(collection(db, 'rooms'), {
          host: user.email,
          gameName: roomName,
          roomDescription,
          mode,
          isPrivate,
          password: isPrivate ? password : '',
          maxPlayers: 4,
          status: 'waiting',
          players: [user.email],
          createdAt: new Date(),
        });
        setRoomId(roomDocRef.id);
        setIsRoomCreated(true);
        setTimeout(() => {
          onClose();
          navigate(`/waiting-room/${roomDocRef.id}`);
        }, 2000); // Close the modal and redirect to waiting room after 2 seconds
      } catch (error) {
        console.error('Error creating game: ', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="HostGameModal">
      <div className="HostGameModalContent">
        <button className="CloseButton" onClick={onClose}>×</button>
        <h1>Host a Game</h1>
        {!isRoomCreated ? (
          <div className="CreateGameForm">
            <label className="InputLabel">
              Room Name:
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter Room name"
                maxLength={20} // Set maximum character limit for room name
              />
              {roomNameError && <p className="ErrorMessage">{roomNameError}</p>}
            </label>
            <label>
              Room Description:
              <textarea
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="Enter room description"
                maxLength={50} // Set maximum character limit for room description
              />
            </label>
            <label>
              Mode:
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </label>
            <label>
              Privacy:
              <select value={isPrivate} onChange={(e) => setIsPrivate(e.target.value === 'true')}>
                <option value="false">Public</option>
                <option value="true">Private</option>
              </select>
            </label>
            {isPrivate && (
              <label className="InputLabel">
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                {passwordError && <p className="ErrorMessage">{passwordError}</p>}
              </label>
            )}
            <div className="ButtonGroup">
              <button className="CreateButton" onClick={handleCreateGame}>Create</button>
              <button onClick={onClose}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="GameCreated">
            <h2>Game Created Successfully!</h2>
            <p>Game ID: {roomId}</p>
            <p>Redirecting to the waiting room...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostGameModal;