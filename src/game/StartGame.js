import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../Firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import './StartGame.css';
import images from '../menu/dashboard/imageUtils';

const StartGame = () => {
  // -------------------------------
  // Helpers
  // -------------------------------

  const getLabel = (row, col) => {
    const letters = 'ABCDEFGHI';
    return `${col + 1}${letters[row]}`;  // e.g. "1A", "2B", etc.
  };

  const shufflePlayers = (players) => {
    return [...players].sort(() => Math.random() - 0.5);
  };

  // Create a fresh board of 108 squares, each with a label, color, and used-flag
  const createInitialBoard = () => {
    return Array(108).fill().map((_, index) => ({
      label: getLabel(Math.floor(index / 12), index % 12),
      color: 'white',
      used: false,
    }));
  };

  // Assign a single new tile to each player if they don't already have tiles
  const assignInitialTiles = (players, boardToUpdate) => {
    players.forEach((player, i) => {
      player.symbol = i === 0 ? 'X' : 'O'; // Example symbols
      player.money = 6000; // Give each player a starting budget
      if (!player.tiles || player.tiles.length === 0) {
        let tile;
        do {
          tile = Math.floor(Math.random() * 108);
        } while (boardToUpdate[tile].used);
        boardToUpdate[tile].used = true;
        // Initialize tile array if not present
        player.tiles = [tile];
      }
    });
  };

  const sortPlayersbyTile = (players) => { 
    return players.sort((a, b) => a.tiles[0] - b.tiles[0]);
  }

  const checkStartHQ = () => {
    let tileIndex = selectedTile;
        // The board is 9 rows x 12 columns = 108 squares
        const row = Math.floor(tileIndex / 12);
        const col = tileIndex % 12;
    
        const directions = [
          [-1, 0], // up
          [1, 0],  // down
          [0, -1], // left
          [0, 1],  // right
        ];
    
        for (const [dr, dc] of directions) {
          const r = row + dr;
          const c = col + dc;
          // check boundaries
          if (r >= 0 && r < 9 && c >= 0 && c < 12) {
            const neighborIndex = r * 12 + c;
            if (board[neighborIndex].color === 'gray') {
              return true; // Found an adjacent gray tile
            }
          }
        }
        return false;
  }

  const [board, setBoard] = useState(createInitialBoard());
  const [HQS, setHQS] = useState([
    { name: 'Sackson', stocks: 25, tiles: 0, price: 0, color:'red' },
    { name: 'Tower', stocks: 25, tiles: 0, price: 0, color:'yellow' },
    { name: 'American', stocks: 25, tiles: 0, price: 0, color:'darkblue' },
    { name: 'Festival', stocks: 25, tiles: 0, price: 0, color:'green' },
    { name: 'WorldWide', stocks: 25, tiles: 0, price: 0, color:'purple' },
    { name: 'Continental', stocks: 25, tiles: 0, price: 0, color:'blue' },
    { name: 'Imperial', stocks: 25, tiles: 0, price: 0, color:'orange' },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [turnCounter, setTurnCounter] = useState(0);

  const [showOptions, setShowOptions] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedHQ, setSelectedHQ] = useState(null);

  const [startHQ, setStartHQ] = useState(false);


  const { gameId } = useParams();
  const navigate = useNavigate();

  const user = auth.currentUser;
  const userEmail = user?.email || '';

  // -------------------------------
  // Initialization function
  // -------------------------------

  const initializeGame = async (roomData) => {
    try {
      const playersFromRoom = roomData.players || [];
      // Fetch each player's doc from /players collection
      const fetchedPlayers = await Promise.all(
        playersFromRoom.map(async (p) => {
          const playerDocRef = doc(db, 'players', p.email);
          const snap = await getDoc(playerDocRef);
          if (snap.exists()) {
            return {
              ...snap.data(),
              email: p.email,
              // Initialize HQS (stock holdings) and empty tile array
              headquarters: HQS.map(hq => ({ name: hq.name, stocks: 0 })),
              tiles: [],
            };
          }
          return null;
        })
      );

      // Filter out any null players
      const validPlayers = fetchedPlayers.filter(Boolean);

      // Only proceed if at least 2 valid players exist
      if (validPlayers.length < 2) {
        console.error('Not enough players to start the game');
        return;
      }

      // Shuffle them and assign tiles
      const shuffled = shufflePlayers(validPlayers);
      const newBoard = createInitialBoard();

      assignInitialTiles(shuffled, newBoard);

      const sortPlayers= sortPlayersbyTile(shuffled);

      // Prepare initial game data
      const gameData = {
        board: newBoard,
        currentPlayerIndex: 0,
        winner: null,
        players: sortPlayers,
        isStarted: true,
        finished: false,
        HQS: HQS.map(hq => ({ name: hq.name, stocks: hq.stocks , price: hq.price, tiles: hq.tiles, color: hq.color})),
        turnCounter: 0,
      };

      // Set the data in 'startedGames' collection
      await setDoc(doc(db, 'startedGames', gameId), gameData);

      // Mark the room as started
      await updateDoc(doc(db, 'rooms', gameId), {
        isStarted: true,
      });
    } catch (err) {
      console.error('Error initializing the game:', err);
    }
  };

  // -------------------------------
  // useEffect: Subscribe to game
  // -------------------------------
  useEffect(() => {
    const gameDocRef = doc(db, 'startedGames', gameId);
    const roomDocRef = doc(db, 'rooms', gameId);

    let unsubscribeGame = null;

    const setupGameSubscription = async () => {
      const gameSnap = await getDoc(gameDocRef);

      // If the game doesn't exist, check if I'm the host and initialize if so
      if (!gameSnap.exists()) {
        const roomSnap = await getDoc(roomDocRef);
        if (!roomSnap.exists()) {
          console.error('No room found to initialize the game');
          return;
        }

        const roomData = roomSnap.data();

        // Only the host can initialize
        if (roomData.host === userEmail) {
          console.log('You are the host. Initializing the game...');
          await initializeGame(roomData);
        } else {
          console.log('Game does not exist yet and you are not the host.');
        }
      }

      // Whether newly created or already existing, subscribe to changes
      unsubscribeGame = onSnapshot(gameDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setBoard(data.board || createInitialBoard());
          setPlayers(data.players || []);
          setCurrentPlayerIndex(data.currentPlayerIndex || 0);
          setWinner(data.winner || null);
          setHQS(data.HQS || HQS);
          setTurnCounter(data.turnCounter || 0);
        }
      });
    };

    setupGameSubscription();

    return () => {
      if (unsubscribeGame) {
        unsubscribeGame();
      }
    };
  }, [gameId, userEmail]);

  // -------------------------------
  // Tile Click / Option Handling
  // -------------------------------

  const handleTileClick = (tileIndex) => {
    if (winner) return;
    // Ensure only current player can pick a tile
    if (players[currentPlayerIndex]?.email !== userEmail) return;

    setSelectedTile(tileIndex);
    setShowOptions(true);
  };

  const assignNewRandomTiles = (tilesToAssign, boardRef) => {
    const newTiles = [];
    for (let i = 0; i < tilesToAssign; i++) {
      let tile;
      do {
        tile = Math.floor(Math.random() * 108);
      } while (boardRef[tile].used);
      boardRef[tile].used = true;
      newTiles.push(tile);
    }
    return newTiles;
  };

  const handleOptionClick = async (option) => {
    if (selectedTile == null) return;

    const newBoard = [...board];
    newBoard[selectedTile] = {
      ...newBoard[selectedTile],
      color: 'gray',
      used: true,
    };

    // Copy players so we can modify
    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    // Remove the used tile from current player's hand
    currPlayer.tiles = currPlayer.tiles.filter(t => t !== selectedTile);
    updatedPlayers[currentPlayerIndex] = currPlayer;

    // Simple placeholders for buy/sell stock logic:
    if (option === 'buy') {
      // Implement buy logic here
      alert('buy');

    } 

    else if (option === 'sell') {
      // Implement sell logic here
  
      alert('sell');

    }

    else if (option === 'start hq') {
      setStartHQ(true);
      if (selectedHQ === null)
        return;
    }

    // After the first "round" (for example), you might deal new tiles
    // This is just example logic. Adjust to your actual rules:
    if (turnCounter >= 1) {
      const newTiles = assignNewRandomTiles(1, newBoard);
      updatedPlayers[currentPlayerIndex].tiles.push(...newTiles);
    }
 
    // Advance the turn
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const newTurnCounter = nextPlayerIndex === 0 ? turnCounter + 1 : turnCounter;

    if (newTurnCounter === 1) {
      for (let i = 0; i < players.length; i++) {
        if (updatedPlayers[i].tiles.length === 0){
            const newTiles = assignNewRandomTiles(6, newBoard);
            updatedPlayers[i].tiles.push(...newTiles);
        }
      }
    }

    setBoard(newBoard);
    setPlayers(updatedPlayers);
    setCurrentPlayerIndex(nextPlayerIndex);
    setTurnCounter(newTurnCounter);
    setShowOptions(false);
    setSelectedTile(null);



    // Persist to Firestore
    try {
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        board: newBoard,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnCounter: newTurnCounter,
      });
    } catch (err) {
      console.error('Error updating Firestore:', err);
    }
  };

  function getConnectedGrayTiles(board) {
    const numRows = 9;
    const numCols = 12;
  
    const visited = new Set();
    const queue = [selectedTile];
  
    const indexToRowCol = (i) => [Math.floor(i / numCols), i % numCols];
    const rowColToIndex = (r, c) => r * numCols + c;
  
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
  
      const [row, col] = indexToRowCol(current);
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];
  
      for (let [nr, nc] of neighbors) {
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
          const neighborIndex = rowColToIndex(nr, nc);
          // Only continue BFS if neighbor is "gray"
          if (board[neighborIndex].color === 'gray') {
            queue.push(neighborIndex);
          }
        }
      }
    }
    return Array.from(visited);
  }

  const handleHQSelection = async (hqName) => {
    try {
      // 1) Find the chosen HQ object
      const chosenHQ = HQS.find(hq => hq.name === hqName);
      if (!chosenHQ) {
        alert('No such HQ found');
        return;
      }
  
      // 2) BFS from the tile that was placed
      const connectedTiles = getConnectedGrayTiles(board, selectedTile);
  
      // 3) Recolor them to chosen HQ color
      const newBoard = [...board];
      connectedTiles.forEach((index) => {
        newBoard[index] = {
          ...newBoard[index],
          color: chosenHQ.color,
        };
      });
  
      // 4) Update HQ data: tile count, price, minus 1 stock
      const newHQS = [...HQS];
      const hqIndex = newHQS.findIndex(h => h.name === hqName);
      newHQS[hqIndex].tiles += connectedTiles.length;
      newHQS[hqIndex].price = 100 * newHQS[hqIndex].tiles; // sample formula
      newHQS[hqIndex].stocks -= 1;
  
      // 5) Give the current player 1 free share
      const newPlayers = [...players];
      const currPlayer = { ...newPlayers[currentPlayerIndex] };
      const playerHqIndex = currPlayer.headquarters.findIndex(h => h.name === hqName);
      if (playerHqIndex !== -1) {
        currPlayer.headquarters[playerHqIndex].stocks += 1;
      }
      newPlayers[currentPlayerIndex] = currPlayer;
  
      // 6) Write to Firestore
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        board: newBoard,
        HQS: newHQS,
        players: newPlayers,
      });
  
      // 7) Update local state
      setBoard(newBoard);
      setHQS(newHQS);
      setPlayers(newPlayers);
  
      // 8) Close the HQ modal
      setStartHQ(false);
      alert(`Started HQ ${hqName}!`);
  
    } catch (err) {
      console.error('Error in handleHQSelection:', err);
    }
  };
  // -------------------------------
  // Rendering
  // -------------------------------

  const renderSquare = (index) => {
    return (
      <div
        key={index}
        className="square"
        style={{ backgroundColor: board[index].color }}
      >
        {board[index].label}
      </div>
    );
  };

  const renderTileButton = (tileIndex) => {
    return (
      <button
        key={tileIndex}
        className="tile-button"
        onClick={() => handleTileClick(tileIndex)}
      >
        {board[tileIndex].label}
      </button>
    );
  };

  const renderStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    }
    return `Next player: ${players[currentPlayerIndex]?.name || 'Loading...'}`;
  };

  const handleReturnHome = () => {
    navigate('/menu');
  };

  return (
    <div className="game">
      <div className="turn-counter">Turn: {turnCounter}</div>

      {/* Board */}
      <div className="game-board">
        {Array(9).fill().map((_, row) => (
          <div key={row} className="board-row">
            {Array(12).fill().map((__, col) => renderSquare(row * 12 + col))}
          </div>
        ))}
      </div>

      {/* Game Info */}
      <div className="game-info">
        <div>{renderStatus()}</div>

        {/* Players */}
        <div className="players-info">
          {players.map((player, index) => (
            <div key={index} className="player">
              {player.profilePic && (
                <img
                  src={images[player.profilePic]}
                  alt={player.name}
                  className="player-image"
                />
              )}
              <div className="player-name">{player.name}</div>
              <div className="player-money">Money: ${player.money}</div>

              <div className="player-headquarters">
                {player.headquarters?.map((hq, hqIndex) => (
                  <div key={hqIndex} className="hq-stock">
                    {hq.name}: {hq.stocks} stocks
                  </div>
                ))}
              </div>

              {/* Current user's tiles */}
              {player.email === userEmail && (
                <div className="player-tiles">
                  <h4>Your Tiles:</h4>
                  {player.tiles?.map(tileIndex => renderTileButton(tileIndex))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Global HQ Info */}
        <div className="hqs-info">
          <h3>Headquarters Stocks</h3>
          {HQS.map((hq, index) => (
            <div key={index} className="hq-stock">
              {hq.name}: {hq.stocks} stocks ,price ${hq.price} each ,tiles: {hq.tiles}
            </div>
          ))}
        </div>

        <button className="return-home-button" onClick={handleReturnHome}>
          Return to Menu
        </button>
      </div>

      {/* Options Overlay */}
      {showOptions && (
        <div className="options">
          {HQS.some(hq => hq.tiles > 0) && (
            <>
              <button onClick={() => handleOptionClick('buy')}>Buy Stock</button>
              <button onClick={() => handleOptionClick('sell')}>Sell Stock</button>
            </>
          )}
          {checkStartHQ() && (
            <>
              <button onClick={() => handleOptionClick('start hq')}>Start HQ</button>
            </>
          )}
          <button onClick={() => handleOptionClick('finish turn')}>finish turn</button>
        </div>
      )}
      {startHQ && (
        <div className="hq-modal">
          <h3>Select an HQ to Start</h3>
          {HQS.map((hq, index) => (
            <button key={index} onClick={() => handleHQSelection(hq.name)}>
              {hq.name}
            </button>
          ))}
          <button onClick={() => setStartHQ(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default StartGame;
