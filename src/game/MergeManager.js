const [pendingMergeQueue, setPendingMergeQueue] = useState(null); // [{ smaller, bigger }]
const [mergeStep, setMergeStep] = useState(0); // index in the queue
const [mergePlayerIndex, setMergePlayerIndex] = useState(0); // index in players
const [mergeDecisionModal, setMergeDecisionModal] = useState(null); // { player, smallHQ, bigHQ }
const [isMerging, setIsMerging] = useState(false);
const [mergeState, setMergeState] = useState(null);
  
  
  
  // -------------------------------merge----------------
  const handleMultiMerge = async (neighborColors, selectedTileIndex) => {
    const mergingHQs = HQS.filter(hq => neighborColors.includes(hq.color));
    if (mergingHQs.length < 2) return;
  
    const sorted = [...mergingHQs].sort((a, b) => a.tiles.length - b.tiles.length);
    const queue = [];
  
    for (let i = 0; i < sorted.length - 1; i++) {
      queue.push({
        smaller: sorted[i],
        bigger: sorted[i + 1],
      });
    }
  
    // Mark board as "in merge mode"
    setIsMerging(true);
  
    // Save merge queue and current step to Firestore
    try {
      await updateDoc(doc(db, 'startedGames', gameId), {
        merge: {
          queue,
          currentStep: 0,
          currentPlayerIndex: 0,
          smallHQ: queue[0].smaller.name,
          bigHQ: queue[0].bigger.name,
          selectedTileIndex,
        },
        
      });
      processMergeStep({
        queue,
        currentStep: 0,
        currentPlayerIndex: 0,
        smallHQ: queue[0].smaller.name,
        bigHQ: queue[0].bigger.name,
        selectedTileIndex,
      });
      
    } catch (err) {
      console.error('Failed to update Firestore with merge data:', err);
    }
  };
  
  const processMergeStep = async (mergeData) => {
    if (!mergeData || !mergeData.queue || mergeData.currentStep >= mergeData.queue.length) return;
  
    const { queue, selectedTileIndex, currentStep } = mergeData;
    const { smaller, bigger } = queue[currentStep];
  
    const newBoard = [...board]; // Use local board
    const newHQS = [...HQS];
    const smallIndex = newHQS.findIndex(h => h.name === smaller.name);
    const bigIndex = newHQS.findIndex(h => h.name === bigger.name);
  
    // Merge tiles from smaller into bigger
    const mergedTiles = [...newHQS[bigIndex].tiles, ...newHQS[smallIndex].tiles];
    mergedTiles.forEach(index => {
      newBoard[index] = {
        ...newBoard[index],
        color: newHQS[bigIndex].color,
      };
    });
  
    if (selectedTileIndex !== undefined) {
      newBoard[selectedTileIndex].color = newHQS[bigIndex].color;
    }
  
    newHQS[bigIndex].tiles = mergedTiles;
    newHQS[bigIndex].price = updateHQPrice(newHQS[bigIndex], mergedTiles.length);
  
    newHQS[smallIndex].tiles = [];
    newHQS[smallIndex].price = 0;
  
    // Pay players for stocks in the smaller HQ
    const updatedPlayers = [...players];
    updatedPlayers.forEach((player) => {
      const hqIndex = player.headquarters.findIndex(h => h.name === smaller.name);
      const owned = player.headquarters[hqIndex]?.stocks || 0;
      const payout = owned * smaller.price;
      player.money += payout;
    });
  
    // Update React state
    setBoard(newBoard);
    setHQS(newHQS);
    setPlayers(updatedPlayers);
  
    // Update Firestore
    try {
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        board: newBoard,
        HQS: newHQS,
        players: updatedPlayers,
        merge: {
          ...mergeData,
          currentPlayerIndex: 0, // Ready for first player's decision
          smallHQ: smaller.name,
          bigHQ: bigger.name,
        },
      });
    } catch (err) {
      console.error('Error updating Firestore in processMergeStep:', err);
    }
  };

  
  const handleMergeDecision = async (choice) => {
    const updatedPlayers = [...players];
    const newHQS = [...HQS];
    const currentPlayer = players[mergeState.currentPlayerIndex];
    const pIndex = players.findIndex(p => p.email === currentPlayer.email);
    const playerData = updatedPlayers[pIndex];
  
    const smallIndex = playerData.headquarters.findIndex(h => h.name === mergeState.smallHQ);
    const bigIndex = playerData.headquarters.findIndex(h => h.name === mergeState.bigHQ);
    const hqSmallIndex = newHQS.findIndex(h => h.name === mergeState.smallHQ);
    const hqBigIndex = newHQS.findIndex(h => h.name === mergeState.bigHQ);
  
    const ownedStocks = playerData.headquarters[smallIndex].stocks;
  
    if (choice === 'sell') {
      const payout = (newHQS[hqSmallIndex].price / 2) * ownedStocks;
      playerData.money += payout;
      playerData.headquarters[smallIndex].stocks = 0;
      newHQS[hqSmallIndex].stocks += ownedStocks;
    } else if (choice === 'swap') {
      const swapAmount = Math.floor(ownedStocks / 2);
      playerData.headquarters[smallIndex].stocks -= swapAmount * 2;
      playerData.headquarters[bigIndex].stocks += swapAmount;
      newHQS[hqSmallIndex].stocks += swapAmount * 2;
      newHQS[hqBigIndex].stocks -= swapAmount;
    }
  
    // Save updated player & HQS
    await updateDoc(doc(db, 'startedGames', gameId), {
      players: updatedPlayers,
      HQS: newHQS,
    });
  
    // Move to next player in decision phase
    const nextPlayerIndex = mergeState.currentPlayerIndex + 1;
  
    if (nextPlayerIndex < players.length) {
      // Update Firestore with next player to decide
      await updateDoc(doc(db, 'startedGames', gameId), {
        'merge.currentPlayerIndex': nextPlayerIndex,
      });
    } else {
      // Done with current merge step
      const nextMergeStep = mergeState.currentStep + 1;
      if (nextMergeStep < mergeState.queue.length) {
        // Move to next merge in queue
        const next = mergeState.queue[nextMergeStep];
        await updateDoc(doc(db, 'startedGames', gameId), {
          merge: {
            ...mergeState,
            currentStep: nextMergeStep,
            currentPlayerIndex: 0,
            smallHQ: next.smaller.name,
            bigHQ: next.bigger.name,
          },
        });
      } else {
        // Merge done ✅
        await updateDoc(doc(db, 'startedGames', gameId), {
          merge: null,
        });
      }
    }
  };
  
  



  {mergeState && (
    <div className="global-merge-waiting">
      <p>
        🔁 Merge in progress. Waiting for <strong>{players[mergeState.currentPlayerIndex]?.name}</strong> to decide...
        ({mergeState.currentPlayerIndex + 1}/{players.length})
      </p>
    </div>
  )}




  {player.email === userEmail && mergeState &&
    mergeState.currentPlayerIndex !== undefined &&
    players[mergeState.currentPlayerIndex].email === userEmail &&
    player.email === players[mergeState.currentPlayerIndex].email && (
     <div className="merge-decision-modal">
       <h3>{player.name}, choose what to do with your stocks in {mergeState.smallHQ}</h3>
       <button onClick={() => handleMergeDecision('sell')}>Sell at half price</button>
       <button onClick={() => handleMergeDecision('swap')}>Swap 2:1 into {mergeState.bigHQ}</button>
     </div>
   )}










//////================================================================
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
            if (board[neighborIndex].color === 'gray' && checkNeighborColor().length === 0 && HQS.some(hq => hq.tiles.length === 0)
            ) {
              return true; // Found an adjacent gray tile
            }
          }
        }
      return false;
  }

  const checkNeighborColor = () => {
    let tileIndex = selectedTile;
    const row = Math.floor(tileIndex / 12);
    const col = tileIndex % 12;
  
    const directions = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1],  // right
    ];
  
    const neighborColors = [];
  
    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      // check boundaries
      if (r >= 0 && r < 9 && c >= 0 && c < 12) {
        const neighborIndex = r * 12 + c;
        const color = board[neighborIndex].color;
        if (color !== 'white' && color !== 'gray') {
          neighborColors.push(color);
        }
      }
    }
  
    // Get unique colors
    const uniqueColors = [...new Set(neighborColors)];
    return uniqueColors;
  };

  const updateHQPrice = (hq, tilesLength) => {
    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex(h => h.name === hq.name);
    if (hq.name === 'Sackson' || hq.name === 'Tower') {
      if (tilesLength === 2) {
        return newHQS[hqIndex].price = 200;
      }
      else if (tilesLength === 3) {
        return newHQS[hqIndex].price = 300;
      }
      else if (tilesLength === 4) {
        return newHQS[hqIndex].price = 400;
      }
      else if (tilesLength === 5) {
        return newHQS[hqIndex].price = 500;
      }
      else if (tilesLength >=6 && tilesLength <= 10) {
        return newHQS[hqIndex].price = 600;
      }
      else if (tilesLength >=11 && tilesLength <= 20) {
        return newHQS[hqIndex].price = 700;
      }
      else if (tilesLength >=21 && tilesLength <= 30) {
        return newHQS[hqIndex].price = 800;
      }
      else if (tilesLength >=31 && tilesLength <= 40) {
        return newHQS[hqIndex].price = 900;
      }
      else if (tilesLength >=41) {
        return newHQS[hqIndex].price = 1000;
      }
    }
    else if (hq.name === 'American' || hq.name === 'Festival' || hq.name === 'WorldWide') {
      if (tilesLength === 2) {
        return newHQS[hqIndex].price = 300;
      }
      else if (tilesLength === 3) {
        return newHQS[hqIndex].price = 400;
      }
      else if (tilesLength === 4) {
        return newHQS[hqIndex].price = 500;
      }
      else if (tilesLength === 5) {
        return newHQS[hqIndex].price = 600;
      }
      else if (tilesLength >=6 && tilesLength <= 10) {
        return newHQS[hqIndex].price = 700;
      }
      else if (tilesLength >=11 && tilesLength <= 20) {
        return newHQS[hqIndex].price = 800;
      }
      else if (tilesLength >=21 && tilesLength <= 30) {
        return newHQS[hqIndex].price = 900;
      }
      else if (tilesLength >=31 && tilesLength <= 40) {
        return newHQS[hqIndex].price = 1000;
      }
      else if (tilesLength >=41) {
        return newHQS[hqIndex].price = 1100;
      }
    }
    else if (hq.name === 'Continental' || hq.name === 'Imperial') {
      if (tilesLength === 2) {
        return newHQS[hqIndex].price = 400;
      }
      else if (tilesLength === 3) {
        return newHQS[hqIndex].price = 500;
      }
      else if (tilesLength === 4) {
        return newHQS[hqIndex].price = 600;
      }
      else if (tilesLength === 5) {
        return newHQS[hqIndex].price = 700;
      }
      else if (tilesLength >=6 && tilesLength <= 10) {
        return newHQS[hqIndex].price = 800;
      }
      else if (tilesLength >=11 && tilesLength <= 20) {
        return newHQS[hqIndex].price = 900;
      }
      else if (tilesLength >=21 && tilesLength <= 30) {
        return newHQS[hqIndex].price = 1000;
      }
      else if (tilesLength >=31 && tilesLength <= 40) {
        return newHQS[hqIndex].price = 1100;
      }
      else if (tilesLength >=41) {
        return newHQS[hqIndex].price = 1200;
      }
    }
    return 404;
  }

  const updateHQ = (hq, connectedTiles) => {
    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex(h => h.name === hq.name);
    newHQS[hqIndex].tiles = [...new Set([...newHQS[hqIndex].tiles, ...connectedTiles])];
    newHQS[hqIndex].price = updateHQPrice(hq, newHQS[hqIndex].tiles.length);
    return newHQS;
  };

  const getTop2PlayersWithMostStocks = (hqName) => {
    // Sort players based on their stock holdings in the specified HQ
    const sortedPlayers = [...players].sort((a, b) => {
      const aStocks = a.headquarters.find(hq => hq.name === hqName)?.stocks || 0;
      const bStocks = b.headquarters.find(hq => hq.name === hqName)?.stocks || 0;
      return bStocks - aStocks;
    });
  
    // Return the top 2 players
    return sortedPlayers.slice(0, 2);
  };




  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeOptions, setMergeOptions] = useState({ smallerHQ: null, largerHQ: null });
  const [playersWithStocks, setPlayersWithStocks] = useState([]);

  const handleSellOrSwap = (playerEmail, action) => {
    const updatedPlayers = [...players];
    const playerIndex = updatedPlayers.findIndex(player => player.email === playerEmail);
    if (playerIndex !== -1) {
      const player = updatedPlayers[playerIndex];
      const smallerHQIndex = player.headquarters.findIndex(hq => hq.name === mergeOptions.smallerHQ.name);
      const largerHQIndex = player.headquarters.findIndex(hq => hq.name === mergeOptions.largerHQ.name);
  
      if (action === 'sell') {
        const stocksToSell = player.headquarters[smallerHQIndex].stocks;
        player.money += stocksToSell * mergeOptions.smallerHQ.price / 2;
        player.headquarters[smallerHQIndex].stocks = 0;
      } else if (action === 'swap') {
        const stocksToSwap = Math.floor(player.headquarters[smallerHQIndex].stocks / 2);
        player.headquarters[smallerHQIndex].stocks -= stocksToSwap * 2;
        player.headquarters[largerHQIndex].stocks += stocksToSwap;
      }
  
      updatedPlayers[playerIndex] = player;
      setPlayers(updatedPlayers);
    }
  };





  const handleMerge = async (neighborColors, selectedTile) => { 
      const mergingHQS = HQS.filter(hq=> neighborColors.includes(hq.color));
      
      console.log(mergingHQS);

      const hqsWithMoreThan10Tiles = mergingHQS.filter(hq => hq.tiles.length > 10);

      if (hqsWithMoreThan10Tiles.length >= 2) {
        console.log('No Merge');
        return false;
      } else {
        console.log('Merge');
        mergingHQS.sort((a, b) => a.tiles.length - b.tiles.length);
        const firstTwoHQS = mergingHQS.slice(0, 2);
        console.log('First two HQs with more than 10 tiles:', firstTwoHQS);

        if (firstTwoHQS[0].tiles.length === firstTwoHQS[1].tiles.length) {
          setMergeOptions({ firstTwoHQS });
          setShowMergeModal(true);
        }
        else { 
          const smallerHQ = firstTwoHQS[0];
          const largerHQ = firstTwoHQS[1];
          console.log('Smaller HQ:', smallerHQ);
          console.log('Larger HQ:', largerHQ);

        const top2Players = getTop2PlayersWithMostStocks(smallerHQ.name);
        const firstPlayerBonus = smallerHQ.price*10;
        const secondPlayerBonus = smallerHQ.price*5;

        const updatedPlayers = [...players];
        if (top2Players[0]) {
          const firstPlayerIndex = updatedPlayers.findIndex(player => player.email === top2Players[0].email);
          if (firstPlayerIndex !== -1) {
            updatedPlayers[firstPlayerIndex].money += firstPlayerBonus;
          }
        }
        if (top2Players[1]) {
          const secondPlayerIndex = updatedPlayers.findIndex(player => player.email === top2Players[1].email);
          if (secondPlayerIndex !== -1) {
            updatedPlayers[secondPlayerIndex].money += secondPlayerBonus;
          }
        }
        setPlayers(updatedPlayers);

        

          const newHQS = [...HQS];
          const smallerHQIndex = newHQS.findIndex(hq => hq.name === smallerHQ.name);
          const largerHQIndex = newHQS.findIndex(hq => hq.name === largerHQ.name);
          newHQS[smallerHQIndex].tiles = [];
          newHQS[smallerHQIndex].price = 0;
          newHQS[smallerHQIndex].stocks = 25;
          newHQS[largerHQIndex].tiles = [...new Set([...newHQS[largerHQIndex].tiles, ...newHQS[smallerHQIndex].tiles, selectedTile])];
          newHQS[largerHQIndex].price = updateHQPrice(largerHQ, newHQS[largerHQIndex].tiles.length);

          const newBoard = [...board];
          largerHQ.tiles.forEach((index) => {
            newBoard[index] = {
              ...newBoard[index],
              color: largerHQ.color,
            };
          });

          setHQS(newHQS);
          setBoard(newBoard);

          console.log(newHQS);
          console.log(newBoard);

          const gameDocRef = doc(db, 'startedGames', gameId);
          await updateDoc(gameDocRef, {
            board: newBoard,
            HQS: newHQS,
          });
        }
      }

      console.log(mergingHQS);
      return true;
  }

  const handleLargerHQSelection = (selectedHQ) => {
    const { smallerHQ, largerHQ } = mergeOptions;
    const chosenLargerHQ = selectedHQ === 'smaller' ? smallerHQ : largerHQ;
  
    console.log('Chosen Larger HQ:', chosenLargerHQ);
  
    setShowMergeModal(false);
  };

  const [board, setBoard] = useState(createInitialBoard());
  const [HQS, setHQS] = useState([
    { name: 'Sackson', stocks: 25, tiles: [], price: 0, color: 'red' },
    { name: 'Tower', stocks: 25, tiles: [], price: 0, color: 'yellow' },
    { name: 'American', stocks: 25, tiles: [], price: 0, color: 'darkblue' },
    { name: 'Festival', stocks: 25, tiles: [], price: 0, color: 'green' },
    { name: 'WorldWide', stocks: 25, tiles: [], price: 0, color: 'purple' },
    { name: 'Continental', stocks: 25, tiles: [], price: 0, color: 'blue' },
    { name: 'Imperial', stocks: 25, tiles: [], price: 0, color: 'orange' },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [turnCounter, setTurnCounter] = useState(0);

  const [showOptions, setShowOptions] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedHQ, setSelectedHQ] = useState(null);

  const [startHQ, setStartHQ] = useState(false);

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedHQToBuy, setSelectedHQToBuy] = useState(null);
  const [buyAmount, setBuyAmount] = useState(0);
  const [stocksBoughtThisTurn, setStocksBoughtThisTurn] = useState(0);

  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedHQToSell, setSelectedHQToSell] = useState(null);
  const [sellAmount, setSellAmount] = useState(0);

  const [buyError, setBuyError] = useState('');
  const [sellError, setSellError] = useState('');

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
  
      const sortPlayers = sortPlayersbyTile(shuffled);
  
      // Prepare initial game data
      const gameData = {
        board: newBoard,
        currentPlayerIndex: 0,
        winner: null,
        players: sortPlayers,
        isStarted: true,
        finished: false,
        HQS: HQS.map(hq => ({ name: hq.name, stocks: hq.stocks, price: hq.price, tiles: [], color: hq.color })),
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

    if (newBoard[selectedTile].color === 'white') {
      newBoard[selectedTile] = {
        ...newBoard[selectedTile],
        color: 'gray',
        used: true,
      };
    }

    // Copy players so we can modify
    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    // Remove the used tile from current player's hand
    currPlayer.tiles = currPlayer.tiles.filter(t => t !== selectedTile);
    updatedPlayers[currentPlayerIndex] = currPlayer;

    // Simple placeholders for buy/sell stock logic:
    if (option === 'buy') {
      setShowBuyModal(true);
      return;
    } 

    else if (option === 'sell') {
      setShowSellModal(true);
      return;
    }

    else if (option === 'start hq') {
      setStartHQ(true);
      if (selectedHQ === null)
        return;
    }
        
    const connectedTiles = getConnectedGrayTiles(board, selectedTile);
    const neighborColors = checkNeighborColor();
      // Recolor all connected tiles to one color from the HQ colors
    if (neighborColors.length === 1) {
      const hqColors = HQS.map(hq => hq.color);
      const selectedColor = hqColors.find(color => neighborColors.includes(color)) || 'gray';
      if (selectedColor !== 'gray') {
          connectedTiles.forEach((index) => {
            newBoard[index] = {
              ...newBoard[index],
              color: selectedColor,
            };
          });

          // Update HQ data: tile count and price
          const newHQS = updateHQ(HQS.find(hq => hq.color === selectedColor), connectedTiles);
          setHQS(newHQS);

      }
    }
    else if(neighborColors.length > 1) {
      console.log(neighborColors);
      handleMerge(neighborColors, selectedTile);
      alert('Handel merge');
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
    setStocksBoughtThisTurn(0);



    // Persist to Firestore
    try {
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        board: newBoard,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnCounter: newTurnCounter,
        HQS: HQS,
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
      newHQS[hqIndex].tiles = [...new Set([...newHQS[hqIndex].tiles, ...connectedTiles])];
      newHQS[hqIndex].price = updateHQPrice(chosenHQ, newHQS[hqIndex].tiles.length);
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

  const handleBuyStock = async () => {
    setBuyError(''); // clear previous error
    if (!selectedHQToBuy || buyAmount <= 0 || buyAmount > 3) {
      setBuyError('Select an HQ and a valid amount (1–3)');
      return;
    }
  
    if (stocksBoughtThisTurn + buyAmount > 3) {
      setBuyError('You can only buy up to 3 stocks per turn.');
      return;
    }
  
    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex(h => h.name === selectedHQToBuy);
    if (hqIndex === -1 || newHQS[hqIndex].stocks < buyAmount) {
      setBuyError('Not enough stocks available.');
      return;
    }
  
    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };
  
    const totalCost = newHQS[hqIndex].price * buyAmount;
    if (currPlayer.money < totalCost) {
      setBuyError('Not enough money to complete this purchase.');
      return;
    }
  
    currPlayer.money -= totalCost;
    currPlayer.headquarters[hqIndex].stocks += buyAmount;
    newHQS[hqIndex].stocks -= buyAmount;
  
    updatedPlayers[currentPlayerIndex] = currPlayer;
  
    // Persist to Firestore
    try {
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        players: updatedPlayers,
        HQS: newHQS,
      });
    } catch (err) {
      console.error('Error updating Firestore:', err);
    }
  
    setPlayers(updatedPlayers);
    setHQS(newHQS);
    setShowBuyModal(false);
    setSelectedHQToBuy(null);
    setBuyAmount(0);
    setStocksBoughtThisTurn(stocksBoughtThisTurn + buyAmount);
  };

  const handleSellStock = async () => {
    setSellError(''); // clear previous error

    if (!selectedHQToSell || sellAmount <= 0 ) {
      setSellError('Select an HQ and enter a valid amount to sell.');
      return;
    }
  
    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex(h => h.name === selectedHQToSell);
  
    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };
    if (currPlayer.headquarters[hqIndex].stocks < sellAmount) {
      setSellError('You don’t have enough stocks to sell.');
      return;
    }
    const totalCost = newHQS[hqIndex].price * sellAmount;

    currPlayer.money += totalCost/2;
    currPlayer.headquarters[hqIndex].stocks -= sellAmount;
    newHQS[hqIndex].stocks += sellAmount;
  
    updatedPlayers[currentPlayerIndex] = currPlayer;
  
    // Persist to Firestore
    try {
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        players: updatedPlayers,
        HQS: newHQS,
      });
    } catch (err) {
      console.error('Error updating Firestore:', err);
    }
  
    setPlayers(updatedPlayers);
    setHQS(newHQS);
    setShowSellModal(false);
    setSelectedHQToSell(null);
    setSellAmount(0);
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
              {hq.name}: {hq.stocks} stocks ,price ${hq.price} each ,tiles: {hq.tiles.length}
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
          {HQS.some(hq => hq.tiles.length > 0) && (
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
          <button onClick={() => handleOptionClick('finish turn')}>Finish Turn</button>
        </div>
      )}
      {startHQ && (
        <div className="hq-modal">
          <h3>Select an HQ to Start</h3>
          {HQS.map((hq, index) => (
            hq.tiles.length === 0 && (
              <button key={index} onClick={() => handleHQSelection(hq.name)}>
                {hq.name}
              </button>
            )
          ))}
          <button onClick={() => setStartHQ(false)}>Cancel</button>
        </div>
      )}
      {showBuyModal && (
        <div className="buy-modal">
          <h3>Buy Stocks</h3>
          <select onChange={(e) => setSelectedHQToBuy(e.target.value)} value={selectedHQToBuy}>
            <option value="">Select HQ</option>
            {HQS.map((hq, index) => (
              hq.tiles.length > 0 &&
              <option key={index} value={hq.name}>
                {hq.name} - ${hq.price} per stock
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={buyAmount}
            onChange={(e) => setBuyAmount(parseInt(e.target.value))}
            placeholder="Amount"
          />
          {buyError && <div className="error-message">{buyError}</div>}
          <button onClick={handleBuyStock}>Buy</button>
          <button onClick={() => setShowBuyModal(false)}>Cancel</button>
        </div>
    )}

    {showSellModal && (
      <div className="sell-modal">
        <h3>Sell Stocks</h3>
        <select onChange={(e) => setSelectedHQToSell(e.target.value)} value={selectedHQToSell}>
          <option value="">Select HQ</option>
          {HQS.map((hq, index) => (
            hq.tiles.length > 0 &&
            <option key={index} value={hq.name}>
              {hq.name} - ${hq.price} per stock
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={sellAmount}
          onChange={(e) => setSellAmount(parseInt(e.target.value))}
          placeholder="Amount"
        />
        {sellError && <div className="error-message">{sellError}</div>}
        <button onClick={handleSellStock}>Sell</button>
        <button onClick={() => setShowSellModal(false)}>Cancel</button>
      </div>
    )}
    </div>
  );
};

export default StartGame;