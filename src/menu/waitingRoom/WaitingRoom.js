import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../Firebase'; // Update the path to the correct location
import { doc, getDoc } from 'firebase/firestore';
import './WaitingRoom.css'; // Import the CSS file for styling

const WaitingRoom = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    const fetchGameData = async () => {
      const gameDocRef = doc(db, 'rooms', gameId);
      const gameDoc = await getDoc(gameDocRef);
      if (gameDoc.exists()) {
        setGameData(gameDoc.data());
      } else {
        console.log('No such document!');
      }
    };

    fetchGameData();
  }, [gameId]);

  return (
    <div className="WaitingRoom">
      {gameData ? (
        <>
          <h1>Waiting Room</h1>
          <p>Game Name: {gameData.gameName}</p>
          <p>Room Description: {gameData.roomDescription}</p>
          <p>Mode: {gameData.mode}</p>
          <p>Players: {gameData.players.join(', ')}</p>
          <p>Waiting for more players to join...</p>
        </>
      ) : (
        <p>Loading game data...</p>
      )}
    </div>
  );
};

export default WaitingRoom;