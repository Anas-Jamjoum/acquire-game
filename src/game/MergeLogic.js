import { useState } from "react";
import { ManageHQS } from "./HQS";
import { ManagePlayers } from "./PlayersInfo"
import { getConnectedGrayTiles } from "./HelperFunctions";




export const ManageMergeLogic = () => {
    const { getBonus, updateHQ } = ManageHQS();
    const { updatePlayers } = ManagePlayers();


    const [isMerging, setIsMerging] = useState(false);
    const [currentBigHQ, setCurrentBigHQ] = useState(null);
    const [hqsWithEqualTileCount, setHqsWithEqualTileCount] = useState(null);
    const [showTieModal, setShowTieModal] = useState(false);
    const [mergeInProgress, setMergeInProgress] = useState(false);
    const [mergePlayersOrder, setMergePlayersOrder] = useState([]);
    const [mergeChoiceIndex, setMergeChoiceIndex] = useState(0);
    const [currentSmallerHQ, setCurrentSmallerHQ] = useState(null);
    const [selectedTileToMerge, setSelectedTileToMerge] = useState(null);
    const [sellSwapAmount, setSellSwapAmount] = useState(0);
    const [mergeError, setMergeError] = useState("");


    const getTop2PlayersWithMostStocks = (players, hqName) => {
        const filteredPlayers = players.filter((player) => {
          const stocks = player.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
          return stocks > 0;
        });
    
        const sortedPlayers = filteredPlayers.sort((a, b) => {
          const aStocks = a.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
          const bStocks = b.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
          return bStocks - aStocks;
        });
    
        return sortedPlayers.slice(0, 2);
    };

    const doMergeLogic = (smallerHQ, biggerHQ, players, currentPlayerIndex, board, HQS) => {

    console.log("doMergeLogic called with:", smallerHQ, biggerHQ);
    setCurrentBigHQ(biggerHQ);
    setCurrentSmallerHQ(smallerHQ);
    console.log("Current smaller HQ:", currentSmallerHQ);
    console.log("Big HQ:", currentBigHQ);


    const top2Players = getTop2PlayersWithMostStocks(players, smallerHQ.name);
    const firstPlayerBonus = getBonus(smallerHQ.name)[0];
    const secondPlayerBonus = getBonus(smallerHQ.name)[1];


    const updatedPlayers = [...players];
    if (top2Players[0]) {
      const idx = updatedPlayers.findIndex(
        (p) => p.email === top2Players[0].email
      );
      if (idx !== -1) updatedPlayers[idx].money += firstPlayerBonus;
    }
    if (top2Players[1]) {
      const idx = updatedPlayers.findIndex(
        (p) => p.email === top2Players[1].email
      );
      if (idx !== -1) updatedPlayers[idx].money += secondPlayerBonus;
    }
    updatePlayers(updatedPlayers);
    // persistGameToFirestore(updatedPlayers, HQS);

    setMergeInProgress(true);

    const smallerName = smallerHQ.name;

    let owners = [];
    for (let i = 0; i < updatedPlayers.length; i++) {
      const stocksInSmaller =
        updatedPlayers[i].headquarters.find((h) => h.name === smallerName)
          ?.stocks || 0;
      if (stocksInSmaller > 0) {
        owners.push(i);
      }
    }

    const startIndex = owners.indexOf(currentPlayerIndex);
    if (startIndex > 0) {

      const front = owners.splice(0, startIndex);
      owners = [...owners, ...front];
    }

    if (owners.length === 0) {
      console.log("dologic No players have stocks in the smaller HQ.");
      endMergeProcess(smallerHQ, biggerHQ, HQS, board);
      return;
    }

    setMergePlayersOrder(owners);
    setMergeChoiceIndex(0);

    setIsMerging(false);

    console.log("Merge players order:up date data base");
    updateDoc(doc(db, "startedGames", gameId), {
      mergeInProgress: true,
      mergePlayersOrder: owners,
      mergeChoiceIndex: 0,
      currentSmallerHQ: smallerHQ.name,
      players: updatedPlayers,
    });
  };

    const handleMerge = async (neighborColors, _selectedTileToMerge, players, currentPlayerIndex, board, HQS) => {
    console.log("handleMerge called with:", neighborColors, board[_selectedTileToMerge].label);
    const mergingHQS = HQS.filter((hq) => neighborColors.includes(hq.color));
    const hqsWithMoreThan10Tiles = mergingHQS.filter(
      (hq) => hq.tiles.length > 10
    );

    if (hqsWithMoreThan10Tiles.length >= 2) {
      console.log("More than 2 HQs with more than 10 tiles");
      return false;
    }
    
    console.log("selected TILE TO MERGE BFORE SET",board[_selectedTileToMerge].label);
    setSelectedTileToMerge(_selectedTileToMerge);

    if (_selectedTileToMerge === null) {
      console.log("No tile selected for merging");
      return false;
    }
    setIsMerging(true);
    mergingHQS.sort((a, b) => a.tiles.length - b.tiles.length);
    const firstTwoHQS = mergingHQS.slice(0, 2);

    if (firstTwoHQS[0].tiles.length === firstTwoHQS[1].tiles.length && !players[currentPlayerIndex].email.startsWith("bot")) {
      console.log("Tie detected between HQs");
      setHqsWithEqualTileCount(firstTwoHQS);
      setShowTieModal(true);
      return;
    }

    let [smaller, bigger] = firstTwoHQS;
  bigger.tiles = [...new Set([...bigger.tiles, _selectedTileToMerge])];

  console.log("Selected tile to merge:", board[_selectedTileToMerge].label);
console.log("Bigger HQ tiles before update:", bigger.tiles);
console.log("Smaller HQ tiles before update:", smaller.tiles);

// Get the labels of the tiles in the bigger and smaller HQs
const biggerTileLabels = bigger.tiles.map((tileIndex) => board[tileIndex]?.label || "Unknown");
const smallerTileLabels = smaller.tiles.map((tileIndex) => board[tileIndex]?.label || "Unknown");

console.log("Bigger HQ tile labels:", biggerTileLabels);
console.log("Smaller HQ tile labels:", smallerTileLabels);

  const updatedBoard = [...board];
  updatedBoard[selectedTileToMerge] = {
    ...updatedBoard[_selectedTileToMerge],
    color: bigger.color,
  };
    doMergeLogic(smaller, bigger, players, currentPlayerIndex, board, HQS);
    return true;
  };

    const goToNextMergePlayer = () => {
    const nextIndex = mergeChoiceIndex + 1;
    setMergeChoiceIndex(nextIndex);

    try {
      if (nextIndex >= mergePlayersOrder.length) {
        console.log("All players have made their choice");
        endMergeProcess();
        return;
      }
      const gameDocRef = doc(db, "startedGames", gameId);
      updateDoc(gameDocRef, {
        mergeChoiceIndex: nextIndex,
      });
    } catch (err) {
      console.error("Failed to update Firestore for next merge player:", err);
    }
  };

    const endMergeProcess = (smallerHQ,biggerHQ,HQS,board) => {
    console.log("Ending merge process");
    const newHQS = [...HQS];
    const newBoard = [...board];

    console.log("Big HQ:", currentBigHQ);
    console.log("Current smaller HQ:", currentSmallerHQ);

    console.log("Bigger HQ:", biggerHQ);
    console.log("cCurrent smaller HQ:", smallerHQ);

    if ((biggerHQ && smallerHQ) || (currentBigHQ && currentSmallerHQ)) {
      const smallerHQend = smallerHQ || currentSmallerHQ;
      const biggerHQend = biggerHQ || currentBigHQ;
      console.log("Merging HQs:", smallerHQend, biggerHQend);
      const biggerIndex = newHQS.findIndex((h) => h.name === biggerHQend.name);
      const smallerIndex = newHQS.findIndex(
        (h) => h.name === smallerHQend.name
      );
      console.log("Bigger HQ index:", biggerIndex);
      console.log("Smaller HQ index:", smallerIndex);
      console.log("Selected tile to merge:", selectedTileToMerge);
      if (biggerIndex !== -1 && smallerIndex !== -1) {
        console.log("Merging tiles");
        newHQS[biggerIndex].tiles = [
          ...new Set([
            ...newHQS[biggerIndex].tiles,
            ...newHQS[smallerIndex].tiles,
            ...getConnectedGrayTiles(board, selectedTileToMerge),
          ]),
        ];
        
        newHQS[smallerIndex].tiles = [];
        newHQS[smallerIndex].stocks = 25;

        updateHQ(newHQS);
      }

      if (smallerIndex !== -1 && biggerIndex !== -1) {
        const biggerTileIndices = newHQS[biggerIndex].tiles;
        const biggerColor = newHQS[biggerIndex].color;

        biggerTileIndices.forEach((tileIndex) => {
          newBoard[tileIndex] = {
            ...newBoard[tileIndex],
            color: biggerColor,
          };
        });
      }
    }
    updateHQ(newHQS);

    setMergeInProgress(false);
    setMergePlayersOrder([]);
    setSelectedTileToMerge(null);
    setCurrentSmallerHQ(null);
    setMergeChoiceIndex(0);
    setShowTieModal(false);
    setCurrentBigHQ(null);
    setHqsWithEqualTileCount(null);
    setIsMerging(false);
    setSellSwapAmount(0);
    setMergeError("");
    persistPlayersToFirestore(newHQS, newBoard);
  };


    return {
        isMerging,
        setIsMerging,
        currentBigHQ,
        setCurrentBigHQ,
        hqsWithEqualTileCount,
        showTieModal,
        setShowTieModal,
        mergeInProgress,
        mergePlayersOrder,
        setMergePlayersOrder,
        setMergeInProgress,
        mergeChoiceIndex,
        setMergeChoiceIndex,
        currentSmallerHQ,
        setCurrentSmallerHQ,
        selectedTileToMerge,
        setSelectedTileToMerge,
        setHqsWithEqualTileCount,
        getTop2PlayersWithMostStocks,
        doMergeLogic,
        handleMerge,
        goToNextMergePlayer,
        endMergeProcess,
        sellSwapAmount,
        setSellSwapAmount,
        mergeError,
        setMergeError,
  };
};
