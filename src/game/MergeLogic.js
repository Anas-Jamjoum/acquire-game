import { useState } from "react";
import { ManageHQS } from "./HQS";
import { getConnectedGrayTiles } from "./HelperFunctions";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../Firebase";
import { useParams, useNavigate } from "react-router-dom";

export const ManageMergeLogic = () => {
    const { getBonus, updateHQ } = ManageHQS();

    const { gameId } = useParams();

    const [isMerging, setIsMerging] = useState(false);
    const [hqsWithEqualTileCount, setHqsWithEqualTileCount] = useState(null);
    const [showTieModal, setShowTieModal] = useState(false);
    const [mergeInProgress, setMergeInProgress] = useState(false);
    const [mergePlayersOrder, setMergePlayersOrder] = useState([]);
    const [mergeChoiceIndex, setMergeChoiceIndex] = useState(0);
    const [sellSwapAmount, setSellSwapAmount] = useState(0);
    const [mergeError, setMergeError] = useState("");

    let currentBigHQ = null;
    let currentSmallerHQ = null;

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

    const handleMerge = async (neighborColors, selectedTileToMerge, players, currentPlayerIndex, board, HQS) => {
      console.log("handleMerge called with selectedTileToMerge:", selectedTileToMerge);
      if (selectedTileToMerge === null) {
        console.log("No tile selected for merging");
        return false;
      }

      const mergingHQS = HQS.filter((hq) => neighborColors.includes(hq.color));
      const hqsWithMoreThan10Tiles = mergingHQS.filter(
        (hq) => hq.tiles.length > 10
      );

      if (hqsWithMoreThan10Tiles.length >= 2) {
        console.log("More than 2 HQs with more than 10 tiles");
        return false;
      }
    
      setIsMerging(true);
      mergingHQS.sort((a, b) => a.tiles.length - b.tiles.length);
      const firstTwoHQS = mergingHQS.slice(0, 2);

      if (firstTwoHQS[0].tiles.length === firstTwoHQS[1].tiles.length && !players[currentPlayerIndex].email.startsWith("bot")) {
        setHqsWithEqualTileCount(firstTwoHQS);
        setShowTieModal(true);
        return;
      }

      let [smallerHQ, biggerHQ] = firstTwoHQS;
      biggerHQ.tiles = [...new Set([...biggerHQ.tiles, selectedTileToMerge])];

      const updatedBoard = [...board];
        updatedBoard[selectedTileToMerge] = {
        ...updatedBoard[selectedTileToMerge],
        color: biggerHQ.color,
      };
      currentBigHQ = biggerHQ;
      currentSmallerHQ = smallerHQ;

      doMergeLogic(smallerHQ, biggerHQ, players, currentPlayerIndex, board, HQS, selectedTileToMerge);
      return true;
    };

    const doMergeLogic = (smallerHQ, biggerHQ, players, currentPlayerIndex, board, HQS, selectedTileToMerge) => {
      console.log(smallerHQ, biggerHQ, players, currentPlayerIndex, board, HQS, selectedTileToMerge);


      console.log("Current smaller HQ:", smallerHQ);
      console.log("Current bigger HQ:", biggerHQ);

      const top2Players = getTop2PlayersWithMostStocks(players, smallerHQ.name, HQS);
      const firstPlayerBonus = getBonus(smallerHQ.name, HQS)[0];
      const secondPlayerBonus = getBonus(smallerHQ.name, HQS)[1];

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

      setMergeInProgress(true);

      let owners = [];
      for (let i = 0; i < updatedPlayers.length; i++) {
        const stocksInSmaller =
          updatedPlayers[i].headquarters.find((h) => h.name === smallerHQ.name)
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
        endMergeProcess(smallerHQ, biggerHQ, HQS, board,selectedTileToMerge);
        return;
      }

      setMergePlayersOrder(owners);
      setMergeChoiceIndex(0);

      setIsMerging(false);

      updateDoc(doc(db, "startedGames", gameId), {
        mergeInProgress: true,
        mergePlayersOrder: owners,
        mergeChoiceIndex: 0,
        currentSmallerHQ: smallerHQ.name,
        currentBigHQ: biggerHQ.name,
        players: updatedPlayers,
      });
  };

    const goToNextMergePlayer = (currentSmallerHQ, currentBigHQ, HQS, board,selectedTileToMerge) => {
    const nextIndex = mergeChoiceIndex + 1;
    setMergeChoiceIndex(nextIndex);

    try {
      if (nextIndex >= mergePlayersOrder.length) {
        console.log("All players have made their choice");
        endMergeProcess(currentSmallerHQ, currentBigHQ, HQS, board,selectedTileToMerge);
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

    const endMergeProcess = (smallerHQ,biggerHQ,HQS,board,selectedTileToMerge) => {
    console.log("End merge process called");
    const newHQS = [...HQS];
    const newBoard = [...board];

    if ((biggerHQ && smallerHQ)) {
      const smallerHQend = smallerHQ ;
      const biggerHQend = biggerHQ ;
      const biggerIndex = newHQS.findIndex((h) => h.name === biggerHQend.name);
      const smallerIndex = newHQS.findIndex(
        (h) => h.name === smallerHQend.name
      );

      if (biggerIndex !== -1 && smallerIndex !== -1) {
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
    setMergeChoiceIndex(0);
    setShowTieModal(false);
    setHqsWithEqualTileCount(null);
    setIsMerging(false);
    setSellSwapAmount(0);
    setMergeError("");
    persistPlayersToFirestore(newHQS, newBoard);
  };

    const persistPlayersToFirestore = (newHQS, newBoard) => {
      try {
        console.log("Persisting players to Firestore");
        console.log("players", players);
        const gameDocRef = doc(db, "startedGames", gameId);
        updateDoc(gameDocRef, {
          mergeInProgress: false,
          mergePlayersOrder: [],
          mergeChoiceIndex: mergeChoiceIndex + 1,
          currentSmallerHQ: null,
          players: players,
          HQS: newHQS,
          board: newBoard,
        });
      } catch (err) {
        console.error("Error updating Firestore:", err);
      }
    };
  const mergeAIDecision = (players, currentPlayerIndex, board, HQS) => {
    console.log("players[currentPlayerIndex]", players);
    const player = players[currentPlayerIndex];
    console.log("Current player:", player);
    console.log("getPlayers", players);
    const smallerStocks =
      player.headquarters.find((h) => h.name === currentSmallerHQ.name)?.stocks || 0;

    if (smallerStocks === 0) {
      goToNextMergePlayer(currentSmallerHQ, currentBigHQ, HQS, board);
      return;
    }

    const decision = smallerStocks >= 2 ? (Math.random() < 0.5 ? "swap" : "sell") : "sell";

    if (decision === "swap") {
      const swapCount = Math.floor(smallerStocks / 2); 
      if (swapCount <= 0) {
        return;
      }

      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex] = {
        ...player,
        headquarters: player.headquarters.map((hq) => {
          if (hq.name === currentSmallerHQ.name) {
            return {
              ...hq,
              stocks: hq.stocks - swapCount * 2,
            };
          } else if (hq.name === currentBigHQ.name) {
            return {
              ...hq,
              stocks: hq.stocks + swapCount,
            };
          }
          return hq;
        }),
      };
      console.log("Updated players after swap:", updatedPlayers);

      // updatePlayers(updatedPlayers);

      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq.name === currentSmallerHQ.name);
      const bigIndex = newHQS.findIndex((hq) => hq.name === currentBigHQ.name);

      newHQS[smallIndex].stocks += swapCount * 2;
      newHQS[bigIndex].stocks -= swapCount;

      updateHQ(newHQS);

    } else if (decision === "sell") {
      // Sell logic: Sell stocks from the smaller HQ for money
      const sellAmount = smallerStocks; // Sell all stocks in the smaller HQ
      const totalMoney = sellAmount * currentSmallerHQ.price;

      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex] = {
        ...player,
        money: player.money + totalMoney,
        headquarters: player.headquarters.map((hq) => {
          if (hq.name === currentSmallerHQ.name) {
            return {
              ...hq,
              stocks: hq.stocks - sellAmount,
            };
          }
          return hq;
        }),
      };

      console.log("Updated players after sell:", updatedPlayers);
      // updatePlayers(updatedPlayers);

      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq.name === currentSmallerHQ.name);
      newHQS[smallIndex].stocks += sellAmount;

      updateHQ(newHQS);
    }

    const stillHasStocks =
      players[currentPlayerIndex].headquarters.find((h) => h.name === currentSmallerHQ.name)?.stocks || 0;

    if (stillHasStocks === 0) {
      goToNextMergePlayer(currentSmallerHQ, currentBigHQ, HQS, board);
    } else {
      setSellSwapAmount(0);
    }

    persistGameToFirestore(players, HQS);
  };

    const persistGameToFirestore = (updatedPlayers, updatedHQS) => {
    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      updateDoc(gameDocRef, {
        players: updatedPlayers,
        HQS: updatedHQS,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
  };

  const renderMergeDecision = (currentSmallerHQ, currentBigHQ, HQS, board,selectedTileToMerge) => {
    console.log("renderMergeDecision called");
    const order = mergePlayersOrder;

    if (mergeChoiceIndex >= order.length || order.length === 0) {
        endMergeProcess(currentSmallerHQ, currentBigHQ, HQS, board,selectedTileToMerge);
      return null;
    }

    const playerIndex = order[mergeChoiceIndex];
    const player = players[playerIndex];
    console.log("getPlayers", players);
    console.log("Current player for merge decision:", player);
    console.log("playerIndex", playerIndex);
    const smallerStocks =
      player.headquarters.find((h) => h.name === currentSmallerHQ.name)
        ?.stocks || 0;
    if (smallerStocks === 0) {
      goToNextMergePlayer(currentSmallerHQ, currentBigHQ, HQS, board);
      return;
    }

    const handleSell = () => {
      if (sellSwapAmount <= 0) {
        setMergeError("You must sell at least 1 stock.");
        return;
      }
      if (sellSwapAmount > smallerStocks) {
        setMergeError("You cannot sell more stocks than you own.");
        return;
      }
  
      setMergeError(""); 
  
      const updatedPlayers = [...players];
      const newMoney = player.money + sellSwapAmount * currentSmallerHQ.price;
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

      console.log("Updated players after sell:", updatedPlayers);
      // updatePlayers(updatedPlayers);

      const newHQS = [...HQS];
      const smallHQIndex = newHQS.findIndex(
        (hq) => hq.name === currentSmallerHQ.name
      );
      newHQS[smallHQIndex].stocks += sellSwapAmount;

      updateHQ(newHQS);
      const stillHasStocks =
        updatedPlayers[playerIndex].headquarters.find(
          (h) => h.name === currentSmallerHQ.name
        )?.stocks || 0;

      if (stillHasStocks === 0) {
        goToNextMergePlayer(currentSmallerHQ, currentBigHQ, HQS, board);
      } else {
        setSellSwapAmount(0);
      }

      persistGameToFirestore(updatedPlayers, newHQS);
    };

    const handleSwap = () => {
      if (sellSwapAmount <= 0) {
        setMergeError("You must swap at least 2 stocks.");
        return;
      }
      if (sellSwapAmount > smallerStocks) {
        setMergeError("You cannot swap more stocks than you own.");
        return;
      }
    
      const swapCount = Math.floor(sellSwapAmount / 2);
      if (swapCount <= 0) {
        setMergeError("You must swap at least 2 stocks to proceed.");
        return;
      }
    
      setMergeError("");
    
      const updatedPlayers = [...players];
      updatedPlayers[playerIndex] = {
        ...player,
        headquarters: player.headquarters.map((hq) => {
          if (!hq || !hq.name) {
            console.error("Invalid HQ object:", hq);
            return hq; // Skip invalid HQs
          }
          if (hq.name === currentSmallerHQ?.name) {
            return {
              ...hq,
              stocks: hq.stocks - swapCount * 2,
            };
          } else if (hq.name === currentBigHQ?.name) {
            return {
              ...hq,
              stocks: hq.stocks + swapCount,
            };
          }
          return hq;
        }),
      };
      console.log("Updated players after swap:", updatedPlayers);
    
      // updatePlayers(updatedPlayers);
    
      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq?.name === currentSmallerHQ?.name);
      const bigIndex = newHQS.findIndex((hq) => hq?.name === currentBigHQ?.name);
    
      if (smallIndex !== -1) {
        newHQS[smallIndex].stocks += swapCount * 2;
      }
      if (bigIndex !== -1) {
        newHQS[bigIndex].stocks -= swapCount;
      }
    updateHQ(newHQS);
    
      const stillHasStocks =
        updatedPlayers[playerIndex].headquarters.find(
          (h) => h?.name === currentSmallerHQ?.name
        )?.stocks || 0;
    
      if (stillHasStocks === 0) {
        goToNextMergePlayer(currentSmallerHQ, currentBigHQ, HQS, board);
      } else {
        setSellSwapAmount(0);
      }
    
      persistGameToFirestore(updatedPlayers, newHQS);
    };

    return (
      <div className="merge-decision-modal">
        <h3>
          Merging HQ: {currentSmallerHQ.name}
          {currentBigHQ && ` and ${currentBigHQ.name}`}
          <br /> 
          {player.name}, you have {smallerStocks} stock(s) in{" "}
          {currentSmallerHQ.name}.
        </h3>
        <p>How many do you want to sell or swap?</p>
        <input
          type="number"
          min="0"
          max={smallerStocks}
          value={sellSwapAmount}
          onChange={(e) => setSellSwapAmount(parseInt(e.target.value, 10) || 0)}
        />
        {mergeError && <div className="error-message">{mergeError}</div>} 
        <button onClick={handleSell}>Sell</button>
        <button onClick={handleSwap}>Swap</button>
      </div>
    );
  };

    

    return {
        isMerging,
        setIsMerging,
        currentBigHQ,
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
        mergeAIDecision,
        renderMergeDecision,
  };
};