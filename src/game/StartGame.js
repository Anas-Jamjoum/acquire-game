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


  const [isMerging, setIsMerging] = useState(false);
  const [bigHQ, setBigHQ] = useState(null);

  const [tieHQs, setTieHQs] = useState(null);
  const [showTieModal, setShowTieModal] = useState(false);

  const [mergeInProgress, setMergeInProgress] = useState(false);
  const [mergePlayersOrder, setMergePlayersOrder] = useState([]);
  const [mergeChoiceIndex, setMergeChoiceIndex] = useState(0);

  // Which HQ do we force everyone to sell/swap from?
  const [currentSmallerHQ, setCurrentSmallerHQ] = useState(null);


  const handleMerge = (neighborColors, selectedTile) => {
    const mergingHQS = HQS.filter(hq => neighborColors.includes(hq.color));
    const hqsWithMoreThan10Tiles = mergingHQS.filter(hq => hq.tiles.length > 10);

    if (hqsWithMoreThan10Tiles.length >= 2) {
      console.log("No Merge");
      return false;
    }

    console.log("Merge");
    setIsMerging(true);

    mergingHQS.sort((a, b) => a.tiles.length - b.tiles.length);
    const firstTwoHQS = mergingHQS.slice(0, 2);

    // Check tie
    if (firstTwoHQS[0].tiles.length === firstTwoHQS[1].tiles.length) {
      // Store them and open modal
      setTieHQs(firstTwoHQS);
      setShowTieModal(true);
      return;
    }

    // Not a tie, proceed directly
    let [smaller, bigger] = firstTwoHQS;
    doMergeLogic(smaller, bigger);
    return true;
  };

  const doMergeLogic = async (smallerHQ, biggerHQ) => {
    console.log("Smaller HQ:", smallerHQ);
    console.log("Bigger HQ:", biggerHQ);

    setBigHQ(biggerHQ);

    // Stock bonus logic
    const top2Players = getTop2PlayersWithMostStocks(smallerHQ.name);
    const firstPlayerBonus = smallerHQ.price * 10;
    const secondPlayerBonus = smallerHQ.price * 5;

    const updatedPlayers = [...players];
    if (top2Players[0]) {
      const idx = updatedPlayers.findIndex(p => p.email === top2Players[0].email);
      if (idx !== -1) updatedPlayers[idx].money += firstPlayerBonus;
    }
    if (top2Players[1]) {
      const idx = updatedPlayers.findIndex(p => p.email === top2Players[1].email);
      if (idx !== -1) updatedPlayers[idx].money += secondPlayerBonus;
    }
    setPlayers(updatedPlayers);

  // 3) Pause normal gameplay and gather everyone
  //    (starting with the same person who triggered the merge, i.e. currentPlayerIndex)
  setMergeInProgress(true);
  setCurrentSmallerHQ(smallerHQ);

  // Build an array of player indices in normal turn order,
  // starting with the player who triggered the merge:
  const smallerName = smallerHQ.name;

  // 1) Gather all player indices who own smaller HQ shares
  let owners = [];
  for (let i = 0; i < updatedPlayers.length; i++) {
    const stocksInSmaller = updatedPlayers[i].headquarters.find(h => h.name === smallerName)?.stocks || 0;
    if (stocksInSmaller > 0) {
      owners.push(i);
    }
  }
  
  // 2) If we want to rotate this list so that `currentPlayerIndex` is first
  // (only if that player is in `owners`):
  const startIndex = owners.indexOf(currentPlayerIndex);
  if (startIndex > 0) {
    // Rotate the array so that `currentPlayerIndex` is front
    // Example rotation approach:
    const front = owners.splice(0, startIndex);
    owners = [...owners, ...front];
  }
  
  if (owners.length === 0) {
    // No players to merge, so end the merge process
    endMergeProcess();
    return;
  }
  // 3) Now `owners` contains only the players who have smaller HQ stock,
  // in the order starting from `currentPlayerIndex` (if they have shares).
  // This becomes your mergePlayersOrder
  setMergePlayersOrder(owners);
  setMergeChoiceIndex(0);

  // We end doMergeLogic here. The UI will show a modal for each player in turn.
  // The game remains “paused” – we do NOT increment `currentPlayerIndex`.

    setIsMerging(false);

    await updateDoc(doc(db, 'startedGames', gameId), {
      mergeInProgress: true,
      mergePlayersOrder: owners,      // the array of player indices
      mergeChoiceIndex: 0,
      currentSmallerHQ: smallerHQ.name,
      players: updatedPlayers,
    });
  };

  const [sellSwapAmount, setSellSwapAmount] = useState(0);

  const renderMergeDecision = () => {
    // The array of players we are iterating over
    const order = mergePlayersOrder;
  
    // If we've gone past the last player, we are done:
    if (mergeChoiceIndex >= order.length || order.length === 0) {
      console.log('All players have made their choice 222');
      // End the merge process
      endMergeProcess();
      return null;
    }
  
    // Which player's turn is it to decide?
    const playerIndex = order[mergeChoiceIndex];
    const player = players[playerIndex];
  
    // How many stocks do they own in the smaller HQ?
    const smallerStocks = player.headquarters.find(h => h.name === currentSmallerHQ.name)?.stocks || 0;
    console.log('Player:', player.name, 'Stocks:', smallerStocks);
    if (smallerStocks === 0) {
      // If they have no stocks left, move on
      goToNextMergePlayer();
      return ;
    }
  
    const handleSell = () => {
      if (sellSwapAmount <= 0) return; 
      if (sellSwapAmount > smallerStocks) return; 
    
      // 1) Update the player's money & smaller HQ shares
      const updatedPlayers = [...players];
      const newMoney = player.money + (sellSwapAmount * currentSmallerHQ.price);
      updatedPlayers[playerIndex] = {
        ...player,
        money: newMoney,
        headquarters: player.headquarters.map((hq) => {
          if (hq.name === currentSmallerHQ.name) {
            return {
              ...hq,
              stocks: hq.stocks - sellSwapAmount,
            };
          }
          return hq;
        }),
      };
    
      setPlayers(updatedPlayers);
    
      // 2) Update global HQS pool:
      const newHQS = [...HQS];
      const smallHQIndex = newHQS.findIndex(
        (hq) => hq.name === currentSmallerHQ.name
      );
      // e.g., each sold share goes back into the smaller HQ’s “pool”
      newHQS[smallHQIndex].stocks += sellSwapAmount;
    
      setHQS(newHQS);
    
      // 3) Check if they still have shares left in the smaller HQ
      const stillHasStocks =
        updatedPlayers[playerIndex].headquarters.find(
          (h) => h.name === currentSmallerHQ.name
        )?.stocks || 0;
    
      if (stillHasStocks === 0) {
        // Move on if they've sold everything
        goToNextMergePlayer();
      } else {
        setSellSwapAmount(0); // reset input
      }
    
      // 4) Update Firestore
      persistGameToFirestore(updatedPlayers, newHQS);
    };
    
    const handleSwap = () => {
      if (sellSwapAmount <= 0) return;
      if (sellSwapAmount > smallerStocks) return;
    
      // 2 smaller => 1 bigger example
      const swapCount = Math.floor(sellSwapAmount / 2);
      if (swapCount <= 0) return; // not enough to do a swap
    
      const updatedPlayers = [...players];
      updatedPlayers[playerIndex] = {
        ...player,
        headquarters: player.headquarters.map((hq) => {
          if (hq.name === currentSmallerHQ.name) {
            return {
              ...hq,
              stocks: hq.stocks - swapCount * 2,
            };
          } else if (hq.name === bigHQ.name) {
            return {
              ...hq,
              stocks: hq.stocks + swapCount,
            };
          }
          return hq;
        }),
      };
    
      setPlayers(updatedPlayers);
    
      // Also update the global HQS
      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq.name === currentSmallerHQ.name);
      const bigIndex = newHQS.findIndex((hq) => hq.name === bigHQ.name);
    
      // For each 2 smaller shares swapped, we put them “back” into smaller HQ’s pool
      newHQS[smallIndex].stocks += swapCount * 2;
    
      // And remove 1 share from big HQ’s pool for each swap
      // (assuming you need to have them in that HQ’s pool to give to the player)
      newHQS[bigIndex].stocks -= swapCount;
    
      setHQS(newHQS);
    
      // Check if still has smaller HQ left
      const stillHasStocks =
        updatedPlayers[playerIndex].headquarters.find(
          (h) => h.name === currentSmallerHQ.name
        )?.stocks || 0;
    
      if (stillHasStocks === 0) {
        goToNextMergePlayer();
      } else {
        setSellSwapAmount(0);
      }
    
      persistGameToFirestore(updatedPlayers, newHQS);
    };
    

    return (
      <div>
        <h3>
          {player.name}, you have {smallerStocks} stock(s) in {currentSmallerHQ.name}.
        </h3>
        <p>How many do you want to sell or swap?</p>
        <input
          type="number"
          min="0"
          max={smallerStocks}
          value={sellSwapAmount}
          onChange={(e) => setSellSwapAmount(parseInt(e.target.value, 10) || 0)}
        />
    
        <button onClick={handleSell}>Sell</button>
        <button onClick={handleSwap}>Swap</button>
      </div>
    );
  };

  const persistGameToFirestore = async (updatedPlayers, updatedHQS) => {
    try {
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        players: updatedPlayers,
        HQS: updatedHQS,
        // If you also want to store mergeChoiceIndex or other fields, do it here
      });
    } catch (err) {
      console.error('Error updating Firestore:', err);
    }
  };
  

  const goToNextMergePlayer = async () => {
    const nextIndex = mergeChoiceIndex + 1;
    setMergeChoiceIndex(nextIndex);

    console.log('Next merge player:', nextIndex);
  
    try {
      if (nextIndex >= mergePlayersOrder.length) {
        // We've finished every player's choice
        console.log('All players have made their choice');
        endMergeProcess();
        return;
      }
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        mergeChoiceIndex: nextIndex,
      });
    } catch (err) {
      console.error('Failed to update Firestore for next merge player:', err);
      // Optionally revert local state or handle error
    }
  };
  
  
  const endMergeProcess = () => {

  // 2) Absorb smaller HQ tiles into the bigger HQ
  const newHQS = [...HQS];
  const newBoard = [...board];

  console.log('Merging HQs:', currentSmallerHQ, bigHQ);

  if (bigHQ && currentSmallerHQ) {
    const biggerIndex = newHQS.findIndex(h => h.name === bigHQ.name);
    const smallerIndex = newHQS.findIndex(h => h.name === currentSmallerHQ.name);

    console.log('Bigger:', biggerIndex, 'Smaller:', smallerIndex);
    if (biggerIndex !== -1 && smallerIndex !== -1) {
      // Merge all tiles from smaller HQ into bigger HQ
      newHQS[biggerIndex].tiles = [
        ...new Set([
          ...newHQS[biggerIndex].tiles,
          ...newHQS[smallerIndex].tiles,
          ...getConnectedGrayTiles(board, selectedTile),
        ]),
      ];
      
      newHQS[biggerIndex].price = updateHQPrice(bigHQ, newHQS[biggerIndex].tiles.length);
      
      // Optionally reset the smaller HQ to reflect that it has been "absorbed"
      newHQS[smallerIndex].tiles = [];
      newHQS[smallerIndex].price = 0; // or some “defunct” marker, depending on your rules
      newHQS[smallerIndex].stocks = 25; // or some “defunct” marker, depending on your rules
    }

    if (smallerIndex !== -1 && biggerIndex !== -1) {
      const biggerTileIndices = HQS[biggerIndex].tiles; 
      // or newHQS[smallerIndex].tiles if you haven't reset them yet
      const biggerColor = newHQS[biggerIndex].color;
  
      biggerTileIndices.forEach((tileIndex) => {
        newBoard[tileIndex] = {
          ...newBoard[tileIndex],
          color: biggerColor,
        };
      });
    }
  
  }
  setHQS(newHQS);


  setBoard(newBoard);

  console.log('Merge process complete');
  console.log('New HQS:', newHQS);
  console.log('New Board:', newBoard);

  setMergeInProgress(false);
  setMergePlayersOrder([]);
  // 3) Update local state
    persistPlayersToFirestore(newHQS, newBoard);
  };
  
  const persistPlayersToFirestore = async (newHQS, newBoard) => {
    console.log('Persisting players to Firestore:', players);
    // Save updated players array (and any changed HQ data) to Firestore
    try {
      const gameDocRef = doc(db, 'startedGames', gameId);
      await updateDoc(gameDocRef, {
        mergeInProgress: false,
        mergePlayersOrder : [],
        mergeChoiceIndex : mergeChoiceIndex + 1,
        currentSmallerHQ: null,
        players: players,
        HQS: newHQS ,
        board: newBoard 
      });
    } catch (err) {
      console.error('Error updating Firestore:', err);
    }
  };
  

  const handleBiggerHQSelection = (bigger, smaller) => {
    setShowTieModal(false);
    setTieHQs(null);
    doMergeLogic(smaller, bigger);
  };

  const handleTieModalCancel = () => {
    setShowTieModal(false);
    setTieHQs(null);
    setIsMerging(false);
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

          // Merge data
          setMergeInProgress(data.mergeInProgress || false);
          setMergePlayersOrder(data.mergePlayersOrder || []);
          setMergeChoiceIndex(data.mergeChoiceIndex || 0);
          // If you store the name of the smaller HQ in Firestore, then:
          const smallerHQ = HQS.find(h => h.name === data.currentSmallerHQ);
          setCurrentSmallerHQ(smallerHQ || null);
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
    console.log('Option: 1', currentPlayerIndex);
    if (selectedTile == null) return;

    const newBoard = [...board];
// Instead of always advancing, do:

console.log('Option: 2', currentPlayerIndex);

    if (newBoard[selectedTile].color === 'white') {
      newBoard[selectedTile] = {
        ...newBoard[selectedTile],
        color: 'gray',
        used: true,
      };
    }
    console.log('Option: 3', currentPlayerIndex);

    // Copy players so we can modify
    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    // Remove the used tile from current player's hand
    currPlayer.tiles = currPlayer.tiles.filter(t => t !== selectedTile);
    updatedPlayers[currentPlayerIndex] = currPlayer;

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
      let checkMerge = handleMerge(neighborColors, selectedTile);
      alert('Handel merge');
      if (checkMerge === true) {
        // maybe delete this
        return;
      }
    }
    console.log('Option: 4', currentPlayerIndex);

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
    console.log('Option: 5', currentPlayerIndex);
    if(isMerging)
      return;

    // After the first "round" (for example), you might deal new tiles
    // This is just example logic. Adjust to your actual rules:
    if (turnCounter >= 1) {
      const newTiles = assignNewRandomTiles(1, newBoard);
      updatedPlayers[currentPlayerIndex].tiles.push(...newTiles);
    }
 
    // Advance the turn
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const newTurnCounter = nextPlayerIndex === 0 ? turnCounter + 1 : turnCounter;

    if (newTurnCounter === 1) {
      for (let i = 0; i < players.length; i++) {
        if (updatedPlayers[i].tiles.length === 0){
            const newTiles = assignNewRandomTiles(6, newBoard);
            updatedPlayers[i].tiles.push(...newTiles);
        }
      }
    }
    console.log('Option: 6', currentPlayerIndex);

    setBoard(newBoard);
    setPlayers(updatedPlayers);
    setCurrentPlayerIndex(nextPlayerIndex);
    setTurnCounter(newTurnCounter);
    setShowOptions(false);
    setSelectedTile(null);
    setStocksBoughtThisTurn(0);

    console.log('Option: 7', currentPlayerIndex);



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
    console.log('buy current player index', currentPlayerIndex);
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

    console.log('Current player Index:', currentPlayerIndex);
    console.log('Current player:', currPlayer);
    console.log('Current player money:', currPlayer.money);
  
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

    console.log('Current player Index:', currentPlayerIndex);
    console.log('Current player:', currPlayer);
    console.log('Current player money:', currPlayer.money);
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


{showTieModal && tieHQs && (
        <>
          {/* Optional overlay */}
          <div className="hq-modal-overlay" onClick={handleTieModalCancel} />

          <div className="hq-modal">
            <h3>Both HQs have the same number of tiles!</h3>
            <p>Which one should be considered the Bigger HQ?</p>

            <button onClick={() => handleBiggerHQSelection(tieHQs[0], tieHQs[1])}>
              {tieHQs[0].name}
            </button>
            <button onClick={() => handleBiggerHQSelection(tieHQs[1], tieHQs[0])}>
              {tieHQs[1].name}
            </button>
            <button onClick={handleTieModalCancel}>Cancel</button>
          </div>
        </>
      )}
    

    {/* MERGE-DECISION MODAL */}
    {mergeInProgress && currentSmallerHQ && (
      (() => {
        const currentMergePlayer = players[mergePlayersOrder[mergeChoiceIndex]] || null;
        if (currentMergePlayer === null) {
          endMergeProcess();
          return null;
        }
        console.log('currentMergePlayer:', currentMergePlayer);
        console.log('email:', userEmail);
        if (currentMergePlayer.email === userEmail) {
          return (
            <div className="hq-modal-overlay">
              <div className="hq-modal">
                {renderMergeDecision()}
              </div>
            </div>
          );
        } else {
          return (
          <div className="waiting-overlay">
            <div className="waiting-message">
              Waiting for {currentMergePlayer.name} to decide...
            </div>
          </div>

          );
        }
      })()
    )}
    </div>
  );
};

export default StartGame;