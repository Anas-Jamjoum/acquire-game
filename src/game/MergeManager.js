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




