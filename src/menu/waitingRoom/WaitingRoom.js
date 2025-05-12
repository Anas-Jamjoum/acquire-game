import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../../Firebase';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayRemove,
  collection,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
import './WaitingRoom.css';
import images from '../dashboard/imageUtils';
import EditRoomDetails from './EditRoomDetails';
import FriendList from '../../friendsManagement/FriendList';

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
        return { ...playerDoc.data(), email };
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
            }, 3000);
          }

          if (gameData.isStarted) {
            navigate(`/start-game/${gameId}`, { state: { gameData } });
          }

          const playersDataPromises = gameData.players.map((player) =>
            fetchPlayerData(player.email)
          );
          const playersData = await Promise.all(playersDataPromises);
          setPlayersData(playersData.filter((player) => player !== null));
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
          }, 1000);
        }
      }
    };

    const intervalId = setInterval(checkKickedStatus, 1000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleStartGame = async () => {
    if (gameData && gameData.host === userEmail) {
      const gameDocRef = doc(db, 'rooms', gameId);
      await updateDoc(gameDocRef, {
        isStarted: true,
      });
      navigate(`/start-game/${gameId}`);
    } else {
      alert('Only the host can start the game.');
    }
  };

  const handleLeaveRoom = async () => {
    const gameDocRef = doc(db, 'rooms', gameId);
    if (gameData.host === userEmail) {
      await updateDoc(gameDocRef, {
        isClosed: true,
      });
      setShowPopup(true);
      setTimeout(async () => {
        await deleteDoc(gameDocRef);
        navigate('/menu');
      }, 3000);
    } else {
      const updatedPlayers = gameData.players.filter(
        (player) => player.email !== userEmail
      );
      await updateDoc(gameDocRef, {
        players: updatedPlayers,
        currentPlayers: gameData.currentPlayers - 1,
      });
      navigate('/menu');
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleRemovePlayer = async (player) => {
    const playerDocRef = doc(db, 'players', player.email);
    await updateDoc(playerDocRef, {
      kicked: true,
      kickedMessage: 'You have been kicked from the room.',
    })
      .then(() => {
        const gameDocRef = doc(db, 'rooms', gameId);
        return updateDoc(gameDocRef, {
          players: arrayRemove({ email: player.email }),
        });
      })
      .then(() => {
        setPlayersData(playersData.filter((p) => p.email !== player.email));
      })
      .catch((error) => {
        console.error('Error removing player: ', error);
      });
  };

  const handleAddBotPlayer = async () => {
    const botsCollectionRef = collection(db, 'bots');
    const botsSnapshot = await getDocs(botsCollectionRef);
    const botsList = botsSnapshot.docs.map((doc) => ({
      email: doc.id,
      ...doc.data(),
    }));
    const availableBots = botsList.filter(
      (bot) => !playersData.some((player) => player.email === bot.email)
    );

    if (availableBots.length > 0) {
      const randomBot =
        availableBots[Math.floor(Math.random() * availableBots.length)];
      const gameDocRef = doc(db, 'rooms', gameId);
      await updateDoc(gameDocRef, {
        players: arrayUnion({ email: randomBot.email }),
      });
      setPlayersData([...playersData, randomBot]);
    }
  };

  return (
    <div className="WaitingRoom">
      <FriendList />
      {kickedMessage && (
        <div className="KickedMessage">
          <p>{kickedMessage}</p>
        </div>
      )}
      {gameData ? (
        <>
          <h1>Waiting Room</h1>
          {isEditing ? (
            <EditRoomDetails
              gameId={gameId}
              gameData={gameData}
              onClose={handleEditToggle}
            />
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
    <img
      src={images[player.profilePic]}
      alt={player.name}
      className="PlayerPic"
    />
    <p>
      {player.email.startsWith('bot')
        ? player.name + ' (Bot)'
        : player.name}
      {player.email === gameData.host ? ' (Host)' : ''}
    </p>
    
    {/* Add this hover details popup */}
    <div className="PlayerDetailsPopup">
      <div className="PlayerDetailsContent">
        <p><strong>Name:</strong> {player.name}</p>
        <p><strong>Level:</strong> {player.level || 0}</p>
        <p><strong>Win Rate:</strong> {player.gamesPlayed > 0
                            ? parseInt((player.gamesWon / player.gamesPlayed) * 100, 10)
                            : 0}% </p>
        <p><strong>Current Streak:</strong> {player.currentStreak || 0}</p>
      </div>
    </div>

    {gameData.host === userEmail &&
      player.email !== gameData.host && (
        <button
          id="kickButton"
          onClick={() => handleRemovePlayer(player)}
        >
          Kick Player
        </button>
      )}
  </div>
))}
                {gameData.host === userEmail && playersData.length < 4 && (
                  <button
                    className="AddBotButton"
                    onClick={handleAddBotPlayer}
                  >
                    Add Bot Player
                  </button>
                )}
              </div>
              {gameData.players.length < gameData.maxPlayers ? (
                <p>Waiting for more players to join {gameData.players.length}/{gameData.maxPlayers}</p>
              ) : (
                <p>Waiting for the host to start...</p>
              )}
              {gameData.host === userEmail && (
                <button
                  className="StartButton"
                  onClick={handleStartGame}
                  disabled={gameData.players.length < gameData.maxPlayers}
                >
                  Start Game
                </button>
              )}
              <button className="LeaveButton" onClick={handleLeaveRoom}>
                Leave Room
              </button>
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