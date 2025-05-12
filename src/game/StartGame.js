import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../Firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import "./StartGame.css";
import images from "../menu/dashboard/imageUtils";
import FriendList from "../friendsManagement/FriendList";

const StartGame = () => {
  const getLabel = (row, col) => {
    const letters = "ABCDEFGHI";
    return `${col + 1}${letters[row]}`;
  };

  const shufflePlayers = (players) => {
    return [...players].sort(() => Math.random() - 0.5);
  };


  const createInitialBoard = () => {
    return Array(108)
      .fill()
      .map((_, index) => ({
        label: getLabel(Math.floor(index / 12), index % 12),
        color: "black",
        used: false,
      }));
  };


  const assignInitialTiles = (players, boardToUpdate) => {
    players.forEach((player, i) => {
      player.money = 6000;
      if (!player.tiles || player.tiles.length === 0) {
        let tile;
        do {
          tile = Math.floor(Math.random() * 108);
        } while (boardToUpdate[tile].used);
        boardToUpdate[tile].used = true;
        player.tiles = [tile];
      }
    });
  };

  const sortPlayersbyTile = (players) => {
    return players.sort((a, b) => a.tiles[0] - b.tiles[0]);
  };

  const checkCanEnd = () => {
    const hqWithMoreThan40Tiles = HQS.some((hq) => hq.tiles.length > 40);

    if (hqWithMoreThan40Tiles) {
      return true;
    }
    return false;
  };

  const checkStartHQ = (tileToIndex) => {
    let tileIndex = tileToIndex;
    const row = Math.floor(tileIndex / 12);
    const col = tileIndex % 12;

    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 9 && c >= 0 && c < 12) {
        const neighborIndex = r * 12 + c;
        if (
          board[neighborIndex].color === "gray" &&
          checkNeighborColor(tileToIndex).length === 0 &&
          HQS.some((hq) => hq.tiles.length === 0)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const checkNeighborColor = (tileIndex) => {
    const connectedTiles = getConnectedGrayTiles(board, tileIndex); // Get all connected tiles
    const numRows = 9;
    const numCols = 12;

    const neighborColors = new Set(); // Use a Set to store unique colors

    const indexToRowCol = (i) => [Math.floor(i / numCols), i % numCols];
    const rowColToIndex = (r, c) => r * numCols + c;

    // Loop through all connected tiles
    connectedTiles.forEach((currentTileIndex) => {
      const [row, col] = indexToRowCol(currentTileIndex);

      const directions = [
        [row - 1, col], // Up
        [row + 1, col], // Down
        [row, col - 1], // Left
        [row, col + 1], // Right
      ];

      // Check neighbors of the current tile
      directions.forEach(([r, c]) => {
        if (r >= 0 && r < numRows && c >= 0 && c < numCols) {
          const neighborIndex = rowColToIndex(r, c);
          const color = board[neighborIndex].color;

          // Add the color to the set if it's not "white" or "gray"
          if (color !== "black" && color !== "gray") {
            neighborColors.add(color);
          }
        }
      });
    });

    return Array.from(neighborColors); // Convert the Set to an Array
  };

  const updateHQPrice = (hq, tilesLength) => {
    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex((h) => h.name === hq.name);
    if (hq.name === "Sackson" || hq.name === "Tower") {
      if (tilesLength === 2) {
        return (newHQS[hqIndex].price = 200);
      } else if (tilesLength === 3) {
        return (newHQS[hqIndex].price = 300);
      } else if (tilesLength === 4) {
        return (newHQS[hqIndex].price = 400);
      } else if (tilesLength === 5) {
        return (newHQS[hqIndex].price = 500);
      } else if (tilesLength >= 6 && tilesLength <= 10) {
        return (newHQS[hqIndex].price = 600);
      } else if (tilesLength >= 11 && tilesLength <= 20) {
        return (newHQS[hqIndex].price = 700);
      } else if (tilesLength >= 21 && tilesLength <= 30) {
        return (newHQS[hqIndex].price = 800);
      } else if (tilesLength >= 31 && tilesLength <= 40) {
        return (newHQS[hqIndex].price = 900);
      } else if (tilesLength >= 41) {
        return (newHQS[hqIndex].price = 1000);
      }
    } else if (
      hq.name === "American" ||
      hq.name === "Festival" ||
      hq.name === "WorldWide"
    ) {
      if (tilesLength === 2) {
        return (newHQS[hqIndex].price = 300);
      } else if (tilesLength === 3) {
        return (newHQS[hqIndex].price = 400);
      } else if (tilesLength === 4) {
        return (newHQS[hqIndex].price = 500);
      } else if (tilesLength === 5) {
        return (newHQS[hqIndex].price = 600);
      } else if (tilesLength >= 6 && tilesLength <= 10) {
        return (newHQS[hqIndex].price = 700);
      } else if (tilesLength >= 11 && tilesLength <= 20) {
        return (newHQS[hqIndex].price = 800);
      } else if (tilesLength >= 21 && tilesLength <= 30) {
        return (newHQS[hqIndex].price = 900);
      } else if (tilesLength >= 31 && tilesLength <= 40) {
        return (newHQS[hqIndex].price = 1000);
      } else if (tilesLength >= 41) {
        return (newHQS[hqIndex].price = 1100);
      }
    } else if (hq.name === "Continental" || hq.name === "Imperial") {
      if (tilesLength === 2) {
        return (newHQS[hqIndex].price = 400);
      } else if (tilesLength === 3) {
        return (newHQS[hqIndex].price = 500);
      } else if (tilesLength === 4) {
        return (newHQS[hqIndex].price = 600);
      } else if (tilesLength === 5) {
        return (newHQS[hqIndex].price = 700);
      } else if (tilesLength >= 6 && tilesLength <= 10) {
        return (newHQS[hqIndex].price = 800);
      } else if (tilesLength >= 11 && tilesLength <= 20) {
        return (newHQS[hqIndex].price = 900);
      } else if (tilesLength >= 21 && tilesLength <= 30) {
        return (newHQS[hqIndex].price = 1000);
      } else if (tilesLength >= 31 && tilesLength <= 40) {
        return (newHQS[hqIndex].price = 1100);
      } else if (tilesLength >= 41) {
        return (newHQS[hqIndex].price = 1200);
      }
    }
    return 404;
  };

  const updateHQ = (hq, connectedTiles) => {
    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex((h) => h.name === hq.name);
    newHQS[hqIndex].tiles = [
      ...new Set([...newHQS[hqIndex].tiles, ...connectedTiles]),
    ].filter(tile => tile !== null);
    newHQS[hqIndex].price = updateHQPrice(hq, newHQS[hqIndex].tiles.length);
    return newHQS;
  };

  const getTop2PlayersWithMostStocks = (hqName) => {
    const filteredPlayers = players.filter((player) => {
      const stocks = player.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
      return stocks > 0; // Only include players with stocks > 0
    });

    const sortedPlayers = filteredPlayers.sort((a, b) => {
      const aStocks = a.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
      const bStocks = b.headquarters.find((hq) => hq.name === hqName)?.stocks || 0;
      return bStocks - aStocks;
    });

    return sortedPlayers.slice(0, 2);
  };

  const [isMerging, setIsMerging] = useState(false);
  const [bigHQ, setBigHQ] = useState(null);

  const [tieHQs, setTieHQs] = useState(null);
  const [showTieModal, setShowTieModal] = useState(false);

  const [mergeInProgress, setMergeInProgress] = useState(false);
  const [mergePlayersOrder, setMergePlayersOrder] = useState([]);
  const [mergeChoiceIndex, setMergeChoiceIndex] = useState(0);

  const [currentSmallerHQ, setCurrentSmallerHQ] = useState(null);
  const [selectedTileToMerge, setSelectedTileToMerge] = useState(null);


  const doMergeLogic = (smallerHQ, biggerHQ) => {

    console.log("doMergeLogic called with:", smallerHQ, biggerHQ);
    setBigHQ(biggerHQ);
    setCurrentSmallerHQ(smallerHQ);
    console.log("Current smaller HQ:", currentSmallerHQ);
    console.log("Big HQ:", bigHQ);


    // Stock bonus logic
    const top2Players = getTop2PlayersWithMostStocks(smallerHQ.name);
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
    setPlayers(updatedPlayers);
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
      endMergeProcess(smallerHQ, biggerHQ);
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

  const handleMerge = async (neighborColors, _selectedTileToMerge) => {
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
      setTieHQs(firstTwoHQS);
      setShowTieModal(true);
      return true;
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
    doMergeLogic(smaller, bigger);
    return true;
  };

  const getBonus = (hqName) => {
    const hqTiles = (HQS.find((hq) => hq.name === hqName)?.tiles || []).length;
    if (hqName === "Sackson" || hqName === "Tower") {
      if (hqTiles === 2) {
        return [2000, 1500];
      } else if (hqTiles === 3) {
        return [3000, 2200];
      } else if (hqTiles === 4) {
        return [4000, 3000];
      } else if (hqTiles === 5) {
        return [5000, 3700];
      } else if (hqTiles >= 6 && hqTiles <= 10) {
        return [6000, 4200];
      } else if (hqTiles >= 11 && hqTiles <= 20) {
        return [7000, 5000];
      } else if (hqTiles >= 21 && hqTiles <= 30) {
        return [8000, 5700];
      } else if (hqTiles >= 31 && hqTiles <= 40) {
        return [9000, 6200];
      } else {
        return [10000, 7000];
      }
    } else if (hqName === "American" || hqName === "Festival" || hqName === "WorldWide") {
      if (hqTiles === 2) {
        return [3000, 2200];
      } else if (hqTiles === 3) {
        return [4000, 3000];
      } else if (hqTiles === 4) {
        return [5000, 3700];
      } else if (hqTiles === 5) {
        return [6000, 4200];
      } else if (hqTiles >= 6 && hqTiles <= 10) {
        return [7000, 5000];
      } else if (hqTiles >= 11 && hqTiles <= 20) {
        return [8000, 5700];
      } else if (hqTiles >= 21 && hqTiles <= 30) {
        return [9000, 6200];
      } else if (hqTiles >= 31 && hqTiles <= 40) {
        return [10000, 7000];
      } else {
        return [11000, 7700];
      }
    } else {
      if (hqTiles === 2) {
        return [4000, 3000];
      } else if (hqTiles === 3) {
        return [5000, 3700];
      } else if (hqTiles === 4) {
        return [6000, 4200];
      } else if (hqTiles === 5) {
        return [7000, 5000];
      } else if (hqTiles >= 6 && hqTiles <= 10) {
        return [8000, 5700];
      } else if (hqTiles >= 11 && hqTiles <= 20) {
        return [9000, 6200];
      } else if (hqTiles >= 21 && hqTiles <= 30) {
        return [10000, 7000];
      } else if (hqTiles >= 31 && hqTiles <= 40) {
        return [11000, 7700];
      } else {
        return [12000, 8200];
      }
    }
  }
  
  const [sellSwapAmount, setSellSwapAmount] = useState(0);
  const [mergeError, setMergeError] = useState("");

  const renderMergeDecision = () => {
    const order = mergePlayersOrder;

    if (mergeChoiceIndex >= order.length || order.length === 0) {
      endMergeProcess();
      return null;
    }

    const playerIndex = order[mergeChoiceIndex];
    const player = players[playerIndex];

    const smallerStocks =
      player.headquarters.find((h) => h.name === currentSmallerHQ.name)
        ?.stocks || 0;
    if (smallerStocks === 0) {
      goToNextMergePlayer();
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

      setPlayers(updatedPlayers);

      const newHQS = [...HQS];
      const smallHQIndex = newHQS.findIndex(
        (hq) => hq.name === currentSmallerHQ.name
      );
      newHQS[smallHQIndex].stocks += sellSwapAmount;

      setHQS(newHQS);

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
          } else if (hq.name === bigHQ?.name) {
            return {
              ...hq,
              stocks: hq.stocks + swapCount,
            };
          }
          return hq;
        }),
      };
    
      setPlayers(updatedPlayers);
    
      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq?.name === currentSmallerHQ?.name);
      const bigIndex = newHQS.findIndex((hq) => hq?.name === bigHQ?.name);
    
      if (smallIndex !== -1) {
        newHQS[smallIndex].stocks += swapCount * 2;
      }
      if (bigIndex !== -1) {
        newHQS[bigIndex].stocks -= swapCount;
      }
    
      setHQS(newHQS);
    
      const stillHasStocks =
        updatedPlayers[playerIndex].headquarters.find(
          (h) => h?.name === currentSmallerHQ?.name
        )?.stocks || 0;
    
      if (stillHasStocks === 0) {
        goToNextMergePlayer();
      } else {
        setSellSwapAmount(0);
      }
    
      persistGameToFirestore(updatedPlayers, newHQS);
    };

    return (
      <div className="merge-decision-modal">
        <h3>
          Merging HQs: {currentSmallerHQ.name} and {bigHQ.name}.
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

  const mergeAIDecision = () => {
    const player = players[currentPlayerIndex];
    const smallerStocks =
      player.headquarters.find((h) => h.name === currentSmallerHQ.name)?.stocks || 0;

    if (smallerStocks === 0) {
      goToNextMergePlayer();
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

      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq.name === currentSmallerHQ.name);
      const bigIndex = newHQS.findIndex((hq) => hq.name === bigHQ.name);

      newHQS[smallIndex].stocks += swapCount * 2;
      newHQS[bigIndex].stocks -= swapCount;

      setHQS(newHQS);

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

      setPlayers(updatedPlayers);

      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq.name === currentSmallerHQ.name);
      newHQS[smallIndex].stocks += sellAmount;

      setHQS(newHQS);
    }

    const stillHasStocks =
      players[currentPlayerIndex].headquarters.find((h) => h.name === currentSmallerHQ.name)?.stocks || 0;

    if (stillHasStocks === 0) {
      goToNextMergePlayer();
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

  const endMergeProcess = (smallerHQ,biggerHQ,) => {
    console.log("Ending merge process");
    const newHQS = [...HQS];
    const newBoard = [...board];

    console.log("Big HQ:", bigHQ);
    console.log("Current smaller HQ:", currentSmallerHQ);

    console.log("Bigger HQ:", biggerHQ);
    console.log("cCurrent smaller HQ:", smallerHQ);

    if ((biggerHQ && smallerHQ) || (bigHQ && currentSmallerHQ)) {
      const smallerHQend = smallerHQ || currentSmallerHQ;
      const biggerHQend = biggerHQ || bigHQ;
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

        newHQS[biggerIndex].price = updateHQPrice(
          biggerHQend,
          newHQS[biggerIndex].tiles.length
        );

        newHQS[smallerIndex].tiles = [];
        newHQS[smallerIndex].price = 0;
        newHQS[smallerIndex].stocks = 25;
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
    setHQS(newHQS);

    setBoard(newBoard);

    setMergeInProgress(false);
    setMergePlayersOrder([]);
    setSelectedTileToMerge(null);
    setCurrentSmallerHQ(null);
    setBigHQ(null);
    setMergeChoiceIndex(0);
    setShowTieModal(false);
    setTieHQs(null);
    setIsMerging(false);
    setSellSwapAmount(0);
    setMergeError("");
    persistPlayersToFirestore(newHQS, newBoard);
  };

  const persistPlayersToFirestore = (newHQS, newBoard) => {
    try {
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
    { name: "Sackson", stocks: 25, tiles: [], price: 0, color: "red" },
    { name: "Tower", stocks: 25, tiles: [], price: 0, color: "yellow" },
    { name: "American", stocks: 25, tiles: [], price: 0, color: "darkblue" },
    { name: "Festival", stocks: 25, tiles: [], price: 0, color: "green" },
    { name: "WorldWide", stocks: 25, tiles: [], price: 0, color: "purple" },
    { name: "Continental", stocks: 25, tiles: [], price: 0, color: "blue" },
    { name: "Imperial", stocks: 25, tiles: [], price: 0, color: "orange" },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [turnCounter, setTurnCounter] = useState(0);
  const [showAllPlayers, setShowAllPlayers] = useState(false); // State to toggle between all players and the current player


  const [showOptions, setShowOptions] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);

  const [startHQ, setStartHQ] = useState(false);
  const [tilesAssignedThisTurn, setTilesAssignedThisTurn] = useState(false);

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedHQToBuy, setSelectedHQToBuy] = useState(null);
  const [buyAmount, setBuyAmount] = useState(0);
  const [stocksBoughtThisTurn, setStocksBoughtThisTurn] = useState(0);

  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedHQToSell, setSelectedHQToSell] = useState(null);
  const [sellAmount, setSellAmount] = useState(0);

  const [buyError, setBuyError] = useState("");
  const [sellError, setSellError] = useState("");

  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const { gameId } = useParams();
  const navigate = useNavigate();

  const user = auth.currentUser;
  const userEmail = user?.email || "";

  const initializeGame = async (roomData) => {
    try {
      const playersFromRoom = roomData.players || [];
      const fetchedPlayers = await Promise.all(
        playersFromRoom.map(async (p) => {
          const playerDocRef = doc(db, "players", p.email);
          const snap = await getDoc(playerDocRef); // Await the getDoc call
          if (snap.exists()) {
            return {
              ...snap.data(),
              email: p.email,
              headquarters: HQS.map((hq) => ({ name: hq.name, stocks: 0 })),
              tiles: [],
            };
          }
          return null;
        })
      );
  
      const validPlayers = fetchedPlayers.filter(Boolean);
  
      if (validPlayers.length < 2) {
        console.error("Not enough players to start the game");
        return;
      }
  
      const shuffled = shufflePlayers(validPlayers);
      const newBoard = createInitialBoard();
  
      assignInitialTiles(shuffled, newBoard);
  
      const sortPlayers = sortPlayersbyTile(shuffled);
  
      const gameData = {
        board: newBoard,
        currentPlayerIndex: 0,
        winner: null,
        players: sortPlayers,
        isStarted: true,
        finished: false,
        HQS: HQS.map((hq) => ({
          name: hq.name,
          stocks: hq.stocks,
          price: hq.price,
          tiles: [],
          color: hq.color,
        })),
        turnCounter: 0,
        mode: roomData.mode,
      };
  
      await setDoc(doc(db, "startedGames", gameId), gameData);
  
      console.log("Game initialized successfully:", gameData);
      await updateDoc(doc(db, "rooms", gameId), {
        isStarted: true,
      });
    } catch (err) {
      console.error("Error initializing the game:", err);
    }
  };


  useEffect(() => {
    if (
      players[currentPlayerIndex] &&
      players[currentPlayerIndex].email.startsWith("bot") &&
      !mergeInProgress &&
      winner === null
    ) {

      const botMoveTimeout = setTimeout(() => {
        handleRandomMove();
      }, 2000);

      return () => clearTimeout(botMoveTimeout);
    }

    if (
      !isOnlineMode ||
      !players[currentPlayerIndex] ||
      winner ||
      mergeInProgress
    ) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current && !mergeInProgress) {
      setTimeLeft(180);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            handleRandomMove();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isOnlineMode,
    currentPlayerIndex,
    players,
    userEmail,
    winner,
    mergeInProgress,
    tilesAssignedThisTurn,
  ]);

  useEffect(() => {
    const gameDocRef = doc(db, "startedGames", gameId);
    const roomDocRef = doc(db, "rooms", gameId);

    let unsubscribeGame = null;

    const setupGameSubscription = async () => {
      const gameSnap = await getDoc(gameDocRef);

      if (!gameSnap.exists()) {
        const roomSnap = await getDoc(roomDocRef);
        if (!roomSnap.exists()) {
          console.error("No room found to initialize the game");
          return;
        }

        const roomData = roomSnap.data();

        if (roomData.host === userEmail) {
          console.log("You are the host. Initializing the game...");
          await initializeGame(roomData);
        } else {
          console.log("Game does not exist yet and you are not the host.");
        }
      }

      unsubscribeGame = onSnapshot(gameDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setBoard(data.board || createInitialBoard());
          setPlayers(data.players || []);
          const newIndex = data.currentPlayerIndex || 0;

          if (newIndex !== currentPlayerIndex.current) {
            setTilesAssignedThisTurn(false);
          }

          setCurrentPlayerIndex(newIndex);
          setWinner(data.winner || null);
          setHQS(data.HQS || HQS);
          setTurnCounter(data.turnCounter || 0);

          if (data.mode === "online") {
            setIsOnlineMode(true);
          } else {
            setIsOnlineMode(false);
          }

          setMergeInProgress(data.mergeInProgress || false);
          setMergePlayersOrder(data.mergePlayersOrder || []);
          setMergeChoiceIndex(data.mergeChoiceIndex || 0);
          if (data.currentSmallerHQ && HQS.length > 0) {
            const smallerHQ = HQS.find((h) => h.name === data.currentSmallerHQ);
            setCurrentSmallerHQ(smallerHQ || currentSmallerHQ);
          } else {
            console.error("currentSmallerHQ is undefined or HQS is empty");
          }
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

  const checkForWinner = (updatedPlayers, updatedHQS, end) => {

    const unusedTiles = getAllUnusedTiles(board, updatedPlayers);
    const noTilesLeft = unusedTiles.length === 0;

    const allHqsOver10 = updatedHQS.every((hq) => hq.tiles.length > 10);


    if (noTilesLeft || allHqsOver10 || end) {
      HQS.forEach((hq) => {
        const top2Players = getTop2PlayersWithMostStocks(hq.name);
        const [firstPlayerBonus, secondPlayerBonus] = getBonus(hq.name);
        if (top2Players[0]) {
          const firstPlayerIndex = updatedPlayers.findIndex(
            (p) => p.email === top2Players[0].email
          );
          if (firstPlayerIndex !== -1) {
            updatedPlayers[firstPlayerIndex].money += firstPlayerBonus;
          }
        }
        if (top2Players[1]) {
          const secondPlayerIndex = updatedPlayers.findIndex(
            (p) => p.email === top2Players[1].email
          );
          if (secondPlayerIndex !== -1) {
            updatedPlayers[secondPlayerIndex].money += secondPlayerBonus;
          }
        }
      });

      updatedPlayers.forEach((player) => {
        player.headquarters.forEach((hq) => {
          const hqIndex = updatedHQS.findIndex((h) => h.name === hq.name);
          if (hq.stocks > 0 && hqIndex !== -1) {
            player.money += updatedHQS[hqIndex].price * hq.stocks;
          }
        });
      });

      setPlayers(updatedPlayers);

      const richestPlayer = updatedPlayers.sort((a, b) => {
        return b.money - a.money;
      })[0];

      const theWinner = richestPlayer.name;

      setWinner(theWinner);

      updatedPlayers.sort((a, b) => b.money - a.money);
      updatedPlayers.forEach((player, index) => {
        if (!player.email.startsWith("bot")) {
          player.gamesPlayed = (player.gamesPlayed || 0) + 1;
          const rankMultiplier = updatedPlayers.length - index;
          const xpEarned = 100 * rankMultiplier;

          player.xp = (player.xp || 0) + xpEarned;
      
          if (player.xp >= player.nextLevelXp) {
            player.level = (player.level || 1) + 1;
            player.xp -= player.nextLevelXp; 
            player.nextLevelXp = (player.nextLevelXp || 1000) + 100;
          }
      
          try {
            const playerDocRef = doc(db, "players", player.email);
            updateDoc(playerDocRef, {
              gamesPlayed: player.gamesPlayed,
              xp: player.xp,
              level: player.level,
              nextLevelXp: player.nextLevelXp,
              currentStreak: 0,
            });
          } catch (err) {
            console.error(`Error updating player ${player.name}:`, err);
          }
        }
      });

      try {
        const gameDocRefPlayers = doc(db, "players", richestPlayer.email);
        updateDoc(gameDocRefPlayers, {
          gamesWon: richestPlayer.gamesWon + 1,
          currentStreak: richestPlayer.currentStreak + 1,
        });

        const gameDocRef = doc(db, "startedGames", gameId);
        updateDoc(gameDocRef, {
          players: updatedPlayers,
          winner: theWinner,
        });

        const gameDocRefRoom = doc(db, "rooms", gameId);
        updateDoc(gameDocRefRoom, {
          status: "finished",
          winner: theWinner,
        });
      } catch (err) {
        console.error("Error updating winner in Firestore:", err);
      }
    }
  };


  const handleRandomMove = () => {
    const currPlayer = players[currentPlayerIndex];
    if (!currPlayer) return;

    if (currPlayer.tiles && currPlayer.tiles.length > 0) {
      const randomTileIndex = Math.floor(
        Math.random() * currPlayer.tiles.length
      );
      const tileToPlace = currPlayer.tiles[randomTileIndex];

      setTimeout(() => {
        handleOptionClickRandom("finish turn", tileToPlace);
      }, 0);
    } else {
      handleOptionClickRandom("finish turn");
    }
  };

  const handleOptionClickRandom = (option, tileIndex) => {
    checkForWinner(players, HQS, false);
    if (tileIndex == null) return;
    const newBoard = [...board];

    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    currPlayer.tiles = currPlayer.tiles.filter((t) => t !== tileIndex);
    updatedPlayers[currentPlayerIndex] = currPlayer;

    const connectedTiles = [...getConnectedGrayTiles(newBoard, tileIndex), tileIndex];
    const neighborColors = checkNeighborColor(tileIndex);

    if (neighborColors.length === 0) {
      newBoard[tileIndex] = {
        ...newBoard[tileIndex],
        color: "gray",
      };

      if (checkStartHQ(tileIndex) && currPlayer.email.startsWith("bot")) {
        const hqsWithNoTiles = HQS.filter((hq) => hq.tiles.length === 0);
        const randomHQIndex = Math.floor(Math.random() * hqsWithNoTiles.length);
        const selectedHQ = hqsWithNoTiles[randomHQIndex];

        connectedTiles.forEach((index) => {
          newBoard[index] = {
            ...newBoard[index],
            color: selectedHQ.color,
          };
        });

        setBoard(newBoard);

        const newHQS = [...HQS];
        const hqIndex = newHQS.findIndex((h) => h.name === selectedHQ.name);
        newHQS[hqIndex].tiles = [
          ...new Set([...newHQS[hqIndex].tiles, ...connectedTiles]),
        ];
        newHQS[hqIndex].price = updateHQPrice(
          selectedHQ,
          newHQS[hqIndex].tiles.length
        );
        newHQS[hqIndex].stocks -= 1;
        const playerHqIndex = currPlayer.headquarters.findIndex(
          (h) => h.name === selectedHQ.name
        );

        currPlayer.headquarters[playerHqIndex].stocks += 1;
        updatedPlayers[currentPlayerIndex] = currPlayer;
        setPlayers(updatedPlayers);
        setHQS(newHQS);
      }

    } else if (neighborColors.length === 1) {
      const hqColors = HQS.map((hq) => hq.color);
      const selectedColor =
        hqColors.find((color) => neighborColors.includes(color)) || "gray";
      if (selectedColor !== "gray") {
        connectedTiles.forEach((index) => {
          newBoard[index] = {
            ...newBoard[index],
            color: selectedColor,
          };
        });
        const newHQS = updateHQ(
          HQS.find((hq) => hq.color === selectedColor),
          connectedTiles
        );
        setHQS(newHQS);
      }
    } else if (neighborColors.length > 1) {
      newBoard[tileIndex] = {
        ...newBoard[tileIndex],
        color: "gray",
      };
      handleMerge(neighborColors, tileIndex);
    }
    setBoard(newBoard);

    const decision = Math.random();
    if (decision < 0.33 && currPlayer.email.startsWith("bot")) { 
      const affordableHQS = HQS.filter(
        (hq) =>
          hq.stocks > 0 &&
          hq.price > 0 &&
          updatedPlayers[currentPlayerIndex].money >= hq.price 
      );
      if (affordableHQS.length > 0 && stocksBoughtThisTurn < 3) {
        const randomHQ = affordableHQS[Math.floor(Math.random() * affordableHQS.length)];
        const hqIndex = HQS.findIndex((hq) => hq.name === randomHQ.name);
        const playerHQIndex = updatedPlayers[currentPlayerIndex].headquarters.findIndex((hq) => hq.name === randomHQ.name);
        const maxStocksCanBuy = checkMaxStocksAi(randomHQ, updatedPlayers[currentPlayerIndex]);
        const randomAmount = Math.floor(Math.random() * maxStocksCanBuy) + 1;
        setStocksBoughtThisTurn(randomAmount);
        const newHQS = [...HQS];
        newHQS[hqIndex].stocks -= randomAmount;
        updatedPlayers[currentPlayerIndex].headquarters[playerHQIndex].stocks += randomAmount;
        updatedPlayers[currentPlayerIndex].money -= randomAmount * randomHQ.price;
        setHQS(newHQS);
        setPlayers(updatedPlayers);
      }
    }

    else if (decision < 0.66 && currPlayer.email.startsWith("bot")) {
    
      const hqsWithStocks = currPlayer.headquarters.filter((hq) => hq.stocks > 0);
    
      if (hqsWithStocks.length > 0) {
        const randomHQIndex = Math.floor(Math.random() * hqsWithStocks.length);
        const hqToSell = hqsWithStocks[randomHQIndex];
    
        const randomAmountToSell = Math.floor(Math.random() * hqToSell.stocks) + 1;
        
        const hqIndex = HQS.findIndex((hq) => hq.name === hqToSell.name);
        const newHQS = [...HQS];
        newHQS[hqIndex].stocks += randomAmountToSell;
    
        updatedPlayers[currentPlayerIndex].headquarters = updatedPlayers[currentPlayerIndex].headquarters.map((hq) => {
          if (hq.name === hqToSell.name) {
            return {
              ...hq,
              stocks: hq.stocks - randomAmountToSell,
            };
          }
          return hq;
        });
    
        updatedPlayers[currentPlayerIndex].money += randomAmountToSell * newHQS[hqIndex].price;
    
        setHQS(newHQS);
        setPlayers(updatedPlayers);
      }
    }

    if (turnCounter >= 1) {
      const newTiles = assignNewRandomTiles(1, newBoard, updatedPlayers);
      updatedPlayers[currentPlayerIndex].tiles.push(...newTiles);
    }
    setPlayers(updatedPlayers);


    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const newTurnCounter =
      nextPlayerIndex === 0 ? turnCounter + 1 : turnCounter;

    if (newTurnCounter === 1) {
      for (let i = 0; i < players.length; i++) {
        if (updatedPlayers[i].tiles.length === 0) {
          const newTiles = assignNewRandomTiles(6, newBoard, updatedPlayers);
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

    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      updateDoc(gameDocRef, {
        board: newBoard,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnCounter: newTurnCounter,
        HQS: HQS,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
    checkForWinner(updatedPlayers, HQS, false);
  };

  const checkMaxStocksAi = (hq, player) => {
    let maxStocks = 0;
    if (!hq || !player) return 0;
    if (hq.stocks <= 0) return 0;
    if (player.money >= hq.price)
      maxStocks++;
    if (player.money >= hq.price * 2)
      maxStocks++;
    if (player.money >= hq.price * 3)
      maxStocks++;
    return maxStocks;
  };

  const renderCountdown = () => {
    if (
      isOnlineMode &&
      players[currentPlayerIndex]?.email === userEmail &&
      timeLeft !== null
    ) {
      return <div className="countdown">Time left: {timeLeft}s</div>;
    }
    return null;
  };


  const handleTileClick = (tileIndex) => {
    if (winner) return;
    if (players[currentPlayerIndex]?.email !== userEmail) return;

    setSelectedTile(tileIndex);
    setShowOptions(true);
  };

  const getAllUnusedTiles = (currentBoard, currentPlayers) => {
    const playerTiles = new Set(currentPlayers.flatMap((player) => player.tiles));

    const unusedTiles = currentBoard.filter((tile) => {
      const tileIndex = currentBoard.indexOf(tile);
      return ((tile.color === "black") && !playerTiles.has(tileIndex));
    });

    return unusedTiles;
  };

  const assignNewRandomTiles = (tilesToAssign, currentBoard, currentPlayers) => {
    const unusedTiles = getAllUnusedTiles(currentBoard, currentPlayers);
    if (unusedTiles.length === 0) {
      return [];
    }

    const newTiles = [];
    for (let i = 0; i < tilesToAssign; i++) {
      if (unusedTiles.length === 0) {
        break;
      }

      const randomIndex = Math.floor(Math.random() * unusedTiles.length);
      const selectedTile = unusedTiles[randomIndex];

      selectedTile.used = true;

      const tileIndex = board.indexOf(selectedTile);
      newTiles.push(tileIndex);

      unusedTiles.splice(randomIndex, 1);
    }

    return newTiles;
  };

  const handleOptionClick = async (option) => {
    if (selectedTile == null) return;

    const newBoard = [...board];


    if (newBoard[selectedTile].color === "black") {
      newBoard[selectedTile] = {
        ...newBoard[selectedTile],
        color: "gray",
        used: true,
      };
    }

    const connectedTiles = getConnectedGrayTiles(board, selectedTile);
    const neighborColors = checkNeighborColor(selectedTile);

    if (neighborColors.length === 1) {
      const hqColors = HQS.map((hq) => hq.color);
      const selectedColor =
        hqColors.find((color) => neighborColors.includes(color)) || "gray";
      if (selectedColor !== "gray") {
        connectedTiles.forEach((index) => {
          newBoard[index] = {
            ...newBoard[index],
            color: selectedColor,
          };
        });

        const newHQS = updateHQ(
          HQS.find((hq) => hq.color === selectedColor),
          connectedTiles
        );
        setHQS(newHQS);
      }
    } else if (neighborColors.length > 1) {
      setBoard(newBoard);
      let checkMerge = await handleMerge(neighborColors, selectedTile);
      // alert("Handel merge");
      console.log("checkMerge", checkMerge);
      if (checkMerge === true) {
        return;
      }
    }
    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    currPlayer.tiles = currPlayer.tiles.filter((t) => t !== selectedTile);
    updatedPlayers[currentPlayerIndex] = currPlayer;

    if (isMerging === "finish turn"){
      console.log("isMerging", isMerging);
      return;
    }
    if (option === "buy") {
      setShowBuyModal(true);
      return;
    } else if (option === "sell") {
      setShowSellModal(true);
      return;
    } else if (option === "start hq") {
      setStartHQ(true);
      return;
    } else if (option === "end game") {
      checkForWinner(updatedPlayers, HQS, true);
      return;
    }
    setBoard(newBoard);

    if (turnCounter >= 1) {
      const newTiles = assignNewRandomTiles(1, newBoard, updatedPlayers);
      updatedPlayers[currentPlayerIndex].tiles.push(...newTiles);
    }
    setPlayers(updatedPlayers);

    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const newTurnCounter =
      nextPlayerIndex === 0 ? turnCounter + 1 : turnCounter;

    if (newTurnCounter === 1) {
      for (let i = 0; i < players.length; i++) {
        if (updatedPlayers[i].tiles.length === 0) {
          const newTiles = assignNewRandomTiles(6, newBoard, updatedPlayers);
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


    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      await updateFirestoreWithRetry(gameDocRef, {
        board: newBoard,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnCounter: newTurnCounter,
        HQS: HQS,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
    checkForWinner(updatedPlayers, HQS, false);
  };

  const updateFirestoreWithRetry = (docRef, data, maxRetries = 10) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        updateDoc(docRef, data);
        console.log("Firestore update successful");
        return; 
      } catch (err) {
        attempt++;
        console.error(`Error updating Firestore (attempt ${attempt}):`, err);
        if (attempt >= maxRetries) {
          console.error("Max retries reached. Update failed.");
          throw err; 
        }
      }
    }
  };

  function getConnectedGrayTiles(board, tileIndex) {
    const numRows = 9;
    const numCols = 12;

    const visited = new Set();
    const queue = [tileIndex];

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
          if (board[neighborIndex].color === "gray") {
            queue.push(neighborIndex);
          }
        }
      }
    }
    return Array.from(visited);
  }

  const handleHQSelection = (hqName) => {
    try {
      const chosenHQ = HQS.find((hq) => hq.name === hqName);
      if (!chosenHQ) {
        alert("No such HQ found");
        return;
      }

      const connectedTiles = getConnectedGrayTiles(board, selectedTile);

      const newBoard = [...board];
      connectedTiles.forEach((index) => {
        newBoard[index] = {
          ...newBoard[index],
          color: chosenHQ.color,
        };
      });

      const newHQS = [...HQS];
      const hqIndex = newHQS.findIndex((h) => h.name === hqName);
      newHQS[hqIndex].tiles = [
        ...new Set([...newHQS[hqIndex].tiles, ...connectedTiles]),
      ];
      newHQS[hqIndex].price = updateHQPrice(
        chosenHQ,
        newHQS[hqIndex].tiles.length
      );
      newHQS[hqIndex].stocks -= 1;

      const newPlayers = [...players];
      const currPlayer = { ...newPlayers[currentPlayerIndex] };
      const playerHqIndex = currPlayer.headquarters.findIndex(
        (h) => h.name === hqName
      );
      if (playerHqIndex !== -1) {
        currPlayer.headquarters[playerHqIndex].stocks += 1;
      }
      newPlayers[currentPlayerIndex] = currPlayer;

      const gameDocRef = doc(db, "startedGames", gameId);
      updateDoc(gameDocRef, {
        board: newBoard,
        HQS: newHQS,
        players: newPlayers,
      });

      setBoard(newBoard);
      setHQS(newHQS);
      setPlayers(newPlayers);

      setStartHQ(false);
    } catch (err) {
      console.error("Error in handleHQSelection:", err);
    }
  };

  const renderSquare = (index) => {
    const currentPlayerTiles = players[currentPlayerIndex]?.tiles || [];
    const isCurrentPlayerTile = currentPlayerTiles.includes(index);
    const isCurrentPlayer = players[currentPlayerIndex]?.email === userEmail;
  
    return (
      <div
        key={index}
        className="square"
        style={{
          backgroundColor: board[index].color,
        }}
      >
        {isCurrentPlayer && isCurrentPlayerTile ? (
          <button
            className="tile-button-board"
            onClick={() => handleTileClick(index)}
          >
            {board[index].label}
          </button>
        ) : (
          board[index].label
        )}
      </div>
    );
  };

  const [showPlayerInfo, setShowPlayerInfo] = useState(false);
  const renderQuickInfo = () => {
    return (
<div className="player-info-container">
  {showPlayerInfo && (
    <div className="player-info-hover">
      {players
        .filter((player) => player.email === userEmail)
        .map((player, index) => (
          <div key={index} className="player-info-details">
            <h3>Your Money </h3>
            <p>Money: ${player.money}</p>
            <h3>Your HQ Stocks:</h3>
            {player.headquarters?.map((hq, hqIndex) => {
            const hqColor =
              HQS.find((h) => h.name === hq.name)?.color || "black";
            return (
              <div key={hqIndex} className="hq-stock">
                <span style={{ color: hqColor }}>■</span> {hq.name}:{" "}
                {hq.stocks} stocks
              </div>
            );
          })}
            <div className="player-tiles">
            <h3>Your Tiles:</h3>
            {player.tiles?.map((tileIndex) =>
              renderTileButton(tileIndex)
            )}
          </div>
                    </div>
        ))}
    </div>
  )}
</div>
    );
  }

  const [showHQInfo, setShowHQInfo] = useState(false);
  const renderHQInfo = () => {
    return (
      <div className="hq-info-container">
      {showHQInfo && (
        <div className="hq-info-hover">
          <h3>Headquarters Information</h3>
          {HQS.map((hq, index) => (
          <div key={index} className="hq-stock">
            <span style={{ color: hq.color }}>■</span> {hq.name}:{hq.stocks}{" "}
            stocks, ${hq.price} each, {hq.tiles.length} tiles
          </div>
        ))}
        </div>
      )}
      </div>
    );
  }

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

  const [showYourTurn, setShowYourTurn] = useState(false);

  useEffect(() => {
    if (players[currentPlayerIndex]?.email === userEmail) {
      setShowYourTurn(true); 
      const timeout = setTimeout(() => {
        setShowYourTurn(false); 
      }, 1500);
  
      return () => clearTimeout(timeout); 
    }
  }, [currentPlayerIndex]);
  
  const renderNoteYourTurn = () => {
    if ((players[currentPlayerIndex]?.email === userEmail) && showYourTurn) {
      return (
        <div className="your-turn">
          <h2>Your Turn!</h2>
        </div>
      );
    }
    return null;
  };

  

  const renderStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    }
    return `Current player turn: ${players[currentPlayerIndex]?.name || "Loading..."
      } `;
  };

  const handleReturnHome = () => {
    navigate("/menu");
  };

  const handleBuyStock = () => {
    setBuyError("");
    if (!selectedHQToBuy || buyAmount <= 0 || buyAmount > 3) {
      setBuyError("Select an HQ and a valid amount (1–3)");
      return;
    }

    if (stocksBoughtThisTurn + buyAmount > 3) {
      setBuyError("You can only buy up to 3 stocks per turn.");
      return;
    }

    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex((h) => h.name === selectedHQToBuy);
    if (hqIndex === -1 || newHQS[hqIndex].stocks < buyAmount) {
      setBuyError("Not enough stocks available.");
      return;
    }

    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    const totalCost = newHQS[hqIndex].price * buyAmount;
    if (currPlayer.money < totalCost) {
      setBuyError("Not enough money to complete this purchase.");
      return;
    }

    currPlayer.money -= totalCost;
    currPlayer.headquarters[hqIndex].stocks += buyAmount;
    newHQS[hqIndex].stocks -= buyAmount;

    updatedPlayers[currentPlayerIndex] = currPlayer;


    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      updateDoc(gameDocRef, {
        players: updatedPlayers,
        HQS: newHQS,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }

    setPlayers(updatedPlayers);
    setHQS(newHQS);
    setShowBuyModal(false);
    setSelectedHQToBuy(null);
    setBuyAmount(0);
    setStocksBoughtThisTurn(stocksBoughtThisTurn + buyAmount);
  };

  const handleSellStock = () => {
    setSellError("");

    if (!selectedHQToSell || sellAmount <= 0) {
      setSellError("Select an HQ and enter a valid amount to sell.");
      return;
    }

    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex((h) => h.name === selectedHQToSell);

    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    if (currPlayer.headquarters[hqIndex].stocks < sellAmount) {
      setSellError("You don’t have enough stocks to sell.");
      return;
    }
    const totalCost = newHQS[hqIndex].price * sellAmount;

    currPlayer.money += totalCost / 2;
    currPlayer.headquarters[hqIndex].stocks -= sellAmount;
    newHQS[hqIndex].stocks += sellAmount;

    updatedPlayers[currentPlayerIndex] = currPlayer;

    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      updateDoc(gameDocRef, {
        players: updatedPlayers,
        HQS: newHQS,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }

    setPlayers(updatedPlayers);
    setHQS(newHQS);
    setShowSellModal(false);
    setSelectedHQToSell(null);
    setSellAmount(0);
  };

  const toggleShowAllPlayers = () => {
    setShowAllPlayers(!showAllPlayers); 
  };

  return (
    <div className="game">
      {!winner && renderNoteYourTurn()}
      {!winner && (
        <>
          <button
            className="player-info-button"
            onClick={() => setShowPlayerInfo(!showPlayerInfo)}
          >
            {showPlayerInfo ? "←" : "→"}
          </button>
          
          <button
            className="hq-info-button"
            onClick={() => setShowHQInfo(!showHQInfo)}
          >
            {showHQInfo ? "→" : "←"}
          </button>
          {showHQInfo && renderHQInfo()}
          {showPlayerInfo && renderQuickInfo()}
        </>
      )}
      <FriendList />
      {winner === null && (<>
        <div className="turn-counter">Turn: {turnCounter}</div>
      <div className="game-board">
        {Array(9)
          .fill()
          .map((_, row) => (
            <div key={row} className="board-row">
              {Array(12)
                .fill()
                .map((__, col) => renderSquare(row * 12 + col))}
            </div>
          ))}
      </div>
      </>)}
      <div className="game-info">
        <div className="game-status">
          {renderStatus()}{" "}
          {
            renderCountdown()
          }
        </div>

        {winner && (

          <div className="winner-overlay">
            <div>
              <h1>Winner: {winner}</h1>

              <button onClick={handleReturnHome}>Return to Home</button>
            </div>
            <div className="sorted-players">
              <h3>Players</h3>
              {players
                .slice() 
                .sort((a, b) => b.money - a.money) 
                .map((player, index) => (
                  <div key={index} className="playeraa">
                    {player.profilePic && (
                      <img
                        src={images[player.profilePic]}
                        alt={player.name}
                        className="player-imageaa"
                      />
                    )}
                    <div className="player-detailsaa">
                      <div className="player-nameaa">{player.name}</div>
                      <div className="player-moneyaa">Money: ${player.money}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

        )}
        <button onClick={toggleShowAllPlayers}>
          {showAllPlayers ? "Show Only Me" : "Show All Players"}
        </button>
      <div className="players-info">
        {showAllPlayers ? (
<div className="players-info-show-all">
  {winner === null && players
    .slice() 
    .sort((a, b) => (a.email === userEmail ? -1 : b.email === userEmail ? 1 : 0)) 
    .map((player, index) => (
      <div key={index} className="player">
        {player.profilePic && (
          <img
            src={images[player.profilePic]}
            alt={player.name}
            className="player-image"
          />
        )}
        <div className="player-name">
          {player.email.startsWith("bot")
            ? `${player.name} (Bot)`
            : player.name}
        </div>
        <div className="player-money">Money: ${player.money}</div>
        <div className="player-level">Level: {player.level}</div>

        <div className="player-headquarters">
          {player.headquarters?.map((hq, hqIndex) => {
            const hqColor =
              HQS.find((h) => h.name === hq.name)?.color || "black";
            return (
              <div key={hqIndex} className="hq-stock">
                <span style={{ color: hqColor }}>■</span> {hq.name}:{" "}
                {hq.stocks} stocks
              </div>
            );
          })}
        </div>

        {player.email === userEmail && (
          <div className="player-tiles">
            <h4>Your Tiles:</h4>
            {player.tiles?.map((tileIndex) =>
              renderTileButton(tileIndex)
            )}
          </div>
        )}
      </div>
    ))}
</div>
        ) : (
  <div className="players-info-show-only-me">
      {winner === null && players
        .filter((player) => player.email === userEmail)
        .map((player, index) => (
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
            <div className="player-level">Level: {player.level}</div>
  
            <div className="player-headquarters">
              {player.headquarters?.map((hq, hqIndex) => {
                const hqColor =
                  HQS.find((h) => h.name === hq.name)?.color || "black";
                return (
                  <div key={hqIndex} className="hq-stock">
                    <span style={{ color: hqColor }}>■</span> {hq.name}:{" "}
                    {hq.stocks} stocks
                  </div>
                );
              })}
            </div>
  
            <div className="player-tiles">
              <h4>Your Tiles:</h4>
              {player.tiles?.map((tileIndex) =>
                renderTileButton(tileIndex)
              )}
            </div>
          </div>
        ))}
      <div className="hqs-info">
        <h3>Headquarters Stocks</h3>
        {HQS.map((hq, index) => (
          <div key={index} className="hq-stock">
            <span style={{ color: hq.color }}>■</span> {hq.name}:{hq.stocks}{" "}
            stocks, ${hq.price} each, {hq.tiles.length} tiles
          </div>
        ))}
      </div>
  </div>
)}
{showAllPlayers && winner === null && (
  <div className="hqs-info">
  <h3>Headquarters Stocks</h3>
  {HQS.map((hq, index) => (
    <div key={index} className="hq-stock">
      <span style={{ color: hq.color }}>■</span> {hq.name}:{hq.stocks}{" "}
      stocks, ${hq.price} each, {hq.tiles.length} tiles
    </div>
  ))}
</div>
)
  }

      </div>

        <button className="return-home-button" onClick={handleReturnHome}>
          Return to Menu
        </button>
      </div>

      {showOptions && !mergeInProgress && winner === null && !startHQ && !showBuyModal && !showSellModal && !showTieModal && (
        <div className="options">
<h3>
  Current Selected Tile:{" "}
  {selectedTile !== null && selectedTile !== undefined
    ? board[selectedTile].label || "Unknown"
    : "No tile selected"}
</h3>          {HQS.some((hq) => hq.tiles.length > 0) && (
            <>
              <button onClick={() => handleOptionClick("buy")}>
                Buy Stock
              </button>
              {players[currentPlayerIndex]?.headquarters.some(hq => hq.stocks > 0) && (
  <button onClick={() => handleOptionClick("sell")}>
    Sell Stock
  </button>
)}
            </>
          )}
          {checkStartHQ(selectedTile) && (
            <>
              <button onClick={() => handleOptionClick("start hq")}>
                Start HQ
              </button>
            </>
          )}
          {checkCanEnd() && (
            <>
              <button onClick={() => handleOptionClick("end game")}>
                End Game
              </button>
            </>
          )}
          <button onClick={() => handleOptionClick("finish turn")}>
            Finish Turn
          </button>
        </div>
      )}
      {startHQ && (
        <div className="hq-modal">
          <h3>Select an HQ to Start</h3>
          {HQS.map(
            (hq, index) =>
              hq.tiles.length === 0 && (
                <button key={index} onClick={() => handleHQSelection(hq.name)}>
                  {hq.name}
                </button>
              )
          )}
          <button onClick={() => setStartHQ(false)}>Cancel</button>
        </div>
      )}

      {showBuyModal && (
        <div className="buy-modal">
          <h3>Buy Stocks</h3>
          <select
  onChange={(e) => setSelectedHQToBuy(e.target.value)}
  value={selectedHQToBuy || ""}
>
  <option value="">Select HQ</option>
  {HQS.map(
    (hq, index) =>
      hq.tiles.length > 0 && (
        <option key={index} value={hq.name}>
          {hq.name} - ${hq.price} per stock
        </option>
      )
  )}
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
          <select
            onChange={(e) => setSelectedHQToSell(e.target.value)}
            value={selectedHQToSell || ""}
          >
            <option value="">Select HQ</option>
            {HQS.filter((hq) => 
  players[currentPlayerIndex]?.headquarters.some(playerHQ => playerHQ.name === hq.name && playerHQ.stocks > 0)
).map((hq, index) => (
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
          <div className="hq-modal-overlay" onClick={handleTieModalCancel} />

          <div className="hq-modal">
            <h3>Both HQs have the same number of tiles!</h3>
            <p>Which one should be considered the Bigger HQ?</p>

            <button
              onClick={() => handleBiggerHQSelection(tieHQs[0], tieHQs[1])}
            >
              {tieHQs[0].name}
            </button>
            <button
              onClick={() => handleBiggerHQSelection(tieHQs[1], tieHQs[0])}
            >
              {tieHQs[1].name}
            </button>
            <button onClick={handleTieModalCancel}>Cancel</button>
          </div>
        </>
      )}

      {mergeInProgress &&
        currentSmallerHQ &&
        (() => {
          const currentMergePlayer =
            players[mergePlayersOrder[mergeChoiceIndex]] || null;
          if (currentMergePlayer === null) {
            endMergeProcess();
            return null;
          }
          if (currentMergePlayer.email === userEmail) {
            return (
              <div className="hq-modal-overlay">
                <div className="">{renderMergeDecision()}</div>
              </div>
            );
          } else if (currentMergePlayer.email.startsWith("bot")) {
            return (
              <div className="waiting-overlay">
                <div className="waiting-message">
                  {/* Merging HQs: {currentSmallerHQ.name} and{bigHQ.name} */}
                  <br />
                  {currentMergePlayer.name} is deciding...
                  {mergeAIDecision()}
                </div>
              </div>
            );
          }
          else {
            return (
              <div className="waiting-overlay">
                <div className="waiting-message">
                  Waiting for {currentMergePlayer.name} to decide...
                </div>
              </div>
            );
          }
        })()}
    </div>
  );
};

export default StartGame;