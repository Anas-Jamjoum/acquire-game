import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../../Firebase'; // Update the path to the correct location
import { doc, getDoc, updateDoc, deleteDoc, onSnapshot, arrayRemove } from 'firebase/firestore';
import './WaitingRoom.css'; // Import the CSS file for styling
import images from '../dashboard/imageUtils'; // Import the images
import EditRoomDetails from './EditRoomDetails'; // Import the EditRoomDetails component

const WaitingRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [playersData, setPlayersData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [kickedMessage, setKickedMessage] = useState('');

  useEffect(() => {
    const fetchPlayerData = async (email) => {
      const playerDocRef = doc(db, 'players', email);
      const playerDoc = await getDoc(playerDocRef);
      if (playerDoc.exists()) {
        return { ...playerDoc.data(), email }; // Include the email in the returned data
      } else {
        console.log('No such document!');
        return null;
      }
    };

    const subscribeToGameData = () => {
      const gameDocRef = doc(db, 'rooms', gameId);
      return onSnapshot(gameDocRef, async (doc) => {
        if (doc.exists()) {
          const gameData = doc.data();
          setGameData(gameData);

          if (gameData.isClosed) {
            setShowPopup(true);
            setTimeout(() => {
              navigate('/menu');
            }, 3000); // Redirect after 3 seconds
          }

          const playersDataPromises = gameData.players.map(player => fetchPlayerData(player.email));
          const playersData = await Promise.all(playersDataPromises);
          setPlayersData(playersData.filter(player => player !== null));
        } else {
          console.log('No such document!');
        }
      });
    };

    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
      const unsubscribe = subscribeToGameData();
      return () => unsubscribe();
    }
  }, [gameId, navigate]);

  useEffect(() => {
    const checkKickedStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const playerDocRef = doc(db, 'players', user.email);
        const playerDoc = await getDoc(playerDocRef);
        if (playerDoc.exists() && playerDoc.data().kicked) {
          setKickedMessage(playerDoc.data().kickedMessage);
          setTimeout(async () => {
            await updateDoc(playerDocRef, {
              kicked: false,
              kickedMessage: '',
            });
            navigate('/menu');
          }, 1000); // Redirect after 3 seconds

        }
      }
    };

    const intervalId = setInterval(checkKickedStatus, 1000); // Check every 5 seconds

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, [navigate]);

  const handleStartGame = async () => {
    if (gameData && gameData.host === userEmail) {
      // Start the game (e.g., update the game status to 'started')
      const gameDocRef = doc(db, 'rooms', gameId);
      await updateDoc(gameDocRef, {
        isStarted: true
      });
      navigate(`/game/${gameId}`);
    } else {
      alert('Only the host can start the game.');
    }
  };

  const handleLeaveRoom = async () => {
    const gameDocRef = doc(db, 'rooms', gameId);
    if (gameData.host === userEmail) {
      // If the user is the host, mark the room as closed and delete the room
      await updateDoc(gameDocRef, {
        isClosed: true
      });
      setShowPopup(true);
      setTimeout(async () => {
        await deleteDoc(gameDocRef);
        navigate('/menu');
      }, 3000); // Redirect after 3 seconds
    } else {
      // If the user is not the host, remove them from the room
      const updatedPlayers = gameData.players.filter(player => player.email !== userEmail);
      await updateDoc(gameDocRef, {
        players: updatedPlayers,
        currentPlayers: gameData.currentPlayers - 1
      });
      navigate('/menu');
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleRemovePlayer = async (player) => {
    // Send a message to the kicked player
    const playerDocRef = doc(db, 'players', player.email); // Assuming player.email is the document ID in the 'players' collection
    await updateDoc(playerDocRef, {
      kicked: true,
      kickedMessage: 'You have been kicked from the room.',
    })
    .then(() => {
      // Remove the player from the room
      const gameDocRef = doc(db, 'rooms', gameId);
      return updateDoc(gameDocRef, {
        players: arrayRemove({ email: player.email }), // Ensure the object structure matches exactly
      });
    })
    .then(() => {
      // Update the local state
      setPlayersData(playersData.filter(p => p.email !== player.email));
    })
    .catch((error) => {
      console.error("Error removing player: ", error);
    });
  };

  return (
    <div className="WaitingRoom">
      {kickedMessage && (
        <div className="KickedMessage">
          <p>{kickedMessage}</p>
        </div>
      )}
      {gameData ? (
        <>
          <h1>Waiting Room</h1>
          {isEditing ? (
            <EditRoomDetails gameId={gameId} gameData={gameData} onClose={handleEditToggle} />
          ) : (
            <>
              <div className="GameDetails">
                <div className="GameDetailsRow">
                  <p>Game Name: {gameData.gameName}</p>
                  <p>Private: {gameData.isPrivate ? 'Yes' : 'No'}</p>
                  <p>Mode: {gameData.mode}</p>
                  <p>Room Description: {gameData.roomDescription}</p>
                  {gameData.host === userEmail && (
                    <button onClick={handleEditToggle}>Edit</button>
                  )}
                </div>
              </div>
              <div className="PlayersList">
                <p>Players:</p>
                {playersData.map((player, index) => (
                  <div key={index} className="PlayerCard">
                    <img src={images[player.profilePic]} alt={player.name} className="PlayerPic" />
                    <p>{player.name}{player.email === gameData.host ? ' (Host)' : ''}</p>
                    {gameData.host === userEmail && player.email !== gameData.host && (
                      <button id="kickButton" onClick={() => handleRemovePlayer(player)}>Kick Player</button>
                    )}
                  </div>
                ))}
              </div>
              <p>Waiting for more players to join...</p>
              {gameData.host === userEmail && (
                <button className="StartButton"
                  onClick={handleStartGame} 
                  disabled={gameData.players.length < gameData.maxPlayers}
                >
                  Start Game
                </button>
              )}
              <button className="LeaveButton" onClick={handleLeaveRoom}>Leave Room</button>
            </>
          )}
        </>
      ) : (
        <p>Loading game data...</p>
      )}
      {showPopup && (
        <div className="Popup">
          <div className="PopupContent">
            <p>The host has left the room. The room is now closed.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;