import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../Firebase'; // Ensure the path is correct and within the src directory
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import './StartGame.css'; // Import the CSS file for styling
import images from '../menu/dashboard/imageUtils'; // Import the images

const StartGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(108).fill(null)); // Update to 108 squares
  const [HQS, setHQS] = useState([
    { name: 'Sackson', stocks: 25 },
    { name: 'Tower', stocks: 25 },
    { name: 'American', stocks: 25 },
    { name: 'Festival', stocks: 25 },
    { name: 'WorldWide', stocks: 25 },
    { name: 'Continental', stocks: 25 },
    { name: 'Imperial', stocks: 25 }
  ]); // Initialize HQS with 7 headquarters, each having 25 stocks and specific names
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [turnCounter, setTurnCounter] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    }

    const gameDocRef = doc(db, 'startedGames', gameId);

    const initializeGame = async () => {
      const gameDoc = await getDoc(gameDocRef);
      if (!gameDoc.exists()) {
        // Fetch players from the room document
        const roomDocRef = doc(db, 'rooms', gameId);
        const roomDoc = await getDoc(roomDocRef);
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          const players = roomData.players || [];

          if (players.length >= 2) {
            const validPlayers = await fetchPlayerData(players);
            const shuffledPlayers = shufflePlayers(validPlayers);
            assignInitialTiles(shuffledPlayers);

            setPlayers(shuffledPlayers);

            await setDoc(gameDocRef, {
              board: Array(108).fill(null), // Update to 108 squares
              currentPlayerIndex: 0,
              winner: null,
              players: shuffledPlayers,
              isStarted: true,
              finished: false,
              HQS: HQS.map(hq => ({ name: hq.name, stocks: 25 })), // Initialize HQS with 7 headquarters, each having 25 stocks and specific names
              turnCounter: 0
            });

            // Update the room document to indicate the game has started
            await updateDoc(roomDocRef, {
              isStarted: true,
            });
          } else {
            console.error('Not enough players to start the game');
          }
        } else {
          console.error('Room document does not exist');
        }
      }
    };

    if (!isInitialized) {
      initializeGame();
      setIsInitialized(true);
    }

    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBoard(data.board || Array(108).fill(null)); // Update to 108 squares
        setPlayers(data.players || []);
        setCurrentPlayerIndex(data.currentPlayerIndex || 0);
        setWinner(data.winner || null);
        setHQS(data.HQS || HQS.map(hq => ({ name: hq.name, stocks: 25 }))); // Update HQS from the database
        setTurnCounter(data.turnCounter || 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPlayerData = async (players) => {
    const playerDataPromises = players.map(async (player) => {
      const playerDocRef = doc(db, 'players', player.email);
      const playerDoc = await getDoc(playerDocRef);
      if (playerDoc.exists()) {
        return { ...playerDoc.data(), email: player.email, headquarters: HQS.map(hq => ({ name: hq.name, stocks: 0 })), tiles: [] }; // Initialize HQ stocks and tiles
      } else {
        console.log('No such document!');
        return null;
      }
    });

    const playerData = await Promise.all(playerDataPromises);
    return playerData.filter(player => player !== null);
  };

  const shufflePlayers = (players) => {
    return [...players].sort(() => Math.random() - 0.5);
  };

  const assignInitialTiles = (players) => {
    const takenTiles = new Set();
    for (let i = 0; i < players.length; i++) {
      players[i].symbol = i === 0 ? 'X' : 'O';
      players[i].money = 6000; // Add money property to each player
      let tile;
      do {
        tile = Math.floor(Math.random() * 108);
      } while (takenTiles.has(tile));
      takenTiles.add(tile);
      players[i].tiles = [tile]; // Assign 1 random tile initially
    }
  };

  const checkWinner = (board) => {
    // Define winning lines for a 9x12 grid
    const lines = [
      // Horizontal lines
      ...Array(9).fill().map((_, row) => Array(12).fill().map((_, col) => row * 12 + col)),
      // Vertical lines
      ...Array(12).fill().map((_, col) => Array(9).fill().map((_, row) => row * 12 + col)),
      // Diagonal lines (top-left to bottom-right)
      ...Array(9).fill().map((_, row) => Array(12).fill().map((_, col) => row * 12 + col)).filter(line => line.length >= 4),
      // Diagonal lines (top-right to bottom-left)
      ...Array(9).fill().map((_, row) => Array(12).fill().map((_, col) => row * 12 + (11 - col))).filter(line => line.length >= 4),
    ];

    for (let line of lines) {
      const [a, b, c, d] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d]) {
        return board[a];
      }
    }
    return null;
  };

  useEffect(() => {
    const winner = checkWinner(board);
    if (winner) {
      setWinner(winner);
      const gameDocRef = doc(db, 'startedGames', gameId);
      updateDoc(gameDocRef, { finished: true });
    }
  }, [board, gameId]);

  const handleClick = async (index) => {
    if (board[index] || winner || players[currentPlayerIndex]?.email !== userEmail) {
      return;
    }

    const newBoard = board.slice();
    newBoard[index] = players[currentPlayerIndex]?.symbol || 'X'; // Default to 'X' if symbol is undefined
    const newCurrentPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Determine the number of tiles to assign
    const tilesToAssign = players.every(player => player.tiles.length === 1) ? 6 : 1;

    // Assign new tiles to the current player
    const newTiles = assignNewTiles(tilesToAssign, players);

    const updatedPlayers = players.map((player, idx) => {
      if (idx === currentPlayerIndex) {
        return { ...player, tiles: [...player.tiles, ...newTiles] };
      }
      return player;
    });

    setBoard(newBoard);
    setCurrentPlayerIndex(newCurrentPlayerIndex);
    setPlayers(updatedPlayers);

    // Increment turn counter after all players have played
    const newTurnCounter = newCurrentPlayerIndex === 0 ? turnCounter + 1 : turnCounter;
    setTurnCounter(newTurnCounter);

    const gameDocRef = doc(db, 'startedGames', gameId);
    await updateDoc(gameDocRef, {
      board: newBoard,
      currentPlayerIndex: newCurrentPlayerIndex,
      winner: checkWinner(newBoard) || null, // Ensure winner is not undefined
      players: updatedPlayers,
      turnCounter: newTurnCounter
    });
  };

  const assignNewTiles = (tilesToAssign, players) => {
    const newTiles = [];
    const takenTiles = new Set(players.flatMap(player => player.tiles));
    for (let i = 0; i < tilesToAssign; i++) {
      let tile;
      do {
        tile = Math.floor(Math.random() * 108);
      } while (takenTiles.has(tile));
      takenTiles.add(tile);
      newTiles.push(tile);
    }
    return newTiles;
  };

  const renderSquare = (index, label) => {
    return (
      <button className="square" onClick={() => handleClick(index)} disabled={players[currentPlayerIndex]?.email !== userEmail}>
        {board[index] || label}
      </button>
    );
  };

  const renderStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    } else {
      return `Next player: ${players[currentPlayerIndex]?.name || 'Loading...'}`;
    }
  };

  const getLabel = (row, col) => {
    const letters = 'ABCDEFGHI';
    return `${col + 1}${letters[row]}`;
  };

  const handleReturnHome = () => {
    navigate('/menu');
  };

  return (
    <div className="game">
      <div className="turn-counter">Turn: {turnCounter}</div>
      <div className="game-board">
        {Array(9).fill().map((_, row) => (
          <div key={row} className="board-row">
            {Array(12).fill().map((_, col) => renderSquare(row * 12 + col, getLabel(row, col)))}
          </div>
        ))}
      </div>
      <div className="game-info">
        <div>{renderStatus()}</div>
        <div className="players-info">
          {players && players.map((player, index) => (
            <div key={index} className="player">
              <img src={images[player.profilePic]} alt={player.name} className="player-image" />
              <div className="player-name">{player.name}</div>
              <div className="player-money">Money: ${player.money}</div>
              <div className="player-headquarters">
                {player.headquarters && player.headquarters.map((hq, hqIndex) => (
                  <div key={hqIndex} className="hq-stock">
                    {hq.name}: {hq.stocks} stocks
                  </div>
                ))}
              </div>
              <div className="player-tiles">
                <h4>Tiles:</h4>
                {player.tiles && player.tiles.map((tile, tileIndex) => (
                  <div key={tileIndex} className="tile">
                    {getLabel(Math.floor(tile / 12), tile % 12)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hqs-info">
          <h3>Headquarters Stocks</h3>
          {HQS.map((hq, index) => (
            <div key={index} className="hq-stock">
              {hq.name}: {hq.stocks} stocks
            </div>
          ))}
        </div>
        <button className="return-home-button" onClick={handleReturnHome}>Return to Menu</button>
      </div>
    </div>
  );
};

export default StartGame;