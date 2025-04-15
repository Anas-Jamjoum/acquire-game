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
        color: "white",
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
    console.log("Checking if the game can end...");

    const hqWithMoreThan40Tiles = HQS.some((hq) => hq.tiles.length > 40);

    if (hqWithMoreThan40Tiles) {
      console.log("An HQ has more than 40 tiles. The game can end.");
      return true;
    }

    console.log("No HQ has more than 40 tiles. The game cannot end.");
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
          if (color !== "white" && color !== "gray") {
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


  const handleMerge = (neighborColors, selectedTileToMerge) => {
    setSelectedTileToMerge(selectedTileToMerge);
    if (selectedTileToMerge === null) return;
    const mergingHQS = HQS.filter((hq) => neighborColors.includes(hq.color));
    console.log("Merging HQs:", mergingHQS);
    const hqsWithMoreThan10Tiles = mergingHQS.filter(
      (hq) => hq.tiles.length > 10
    );

    if (hqsWithMoreThan10Tiles.length >= 2) {
      console.log("No Merge");
      return false;
    }

    console.log("Merge " + board[selectedTileToMerge].label + " " + players[currentPlayerIndex].name);
    setIsMerging(true);

    mergingHQS.sort((a, b) => a.tiles.length - b.tiles.length);
    const firstTwoHQS = mergingHQS.slice(0, 2);

    // Check tie
    if (firstTwoHQS[0].tiles.length === firstTwoHQS[1].tiles.length && !players[currentPlayerIndex].email.startsWith("bot")) {
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

  const doMergeLogic = (smallerHQ, biggerHQ) => {
    console.log("Smaller HQ:", smallerHQ);
    console.log("Bigger HQ:", biggerHQ);

    setBigHQ(biggerHQ);

    // Stock bonus logic
    const top2Players = getTop2PlayersWithMostStocks(smallerHQ.name);
    const firstPlayerBonus = smallerHQ.price * 10;
    const secondPlayerBonus = smallerHQ.price * 5;

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

    setMergeInProgress(true);
    setCurrentSmallerHQ(smallerHQ);


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
      endMergeProcess();
      return;
    }

    setMergePlayersOrder(owners);
    setMergeChoiceIndex(0);

    setIsMerging(false);
    console.log("Merge players order:", currentSmallerHQ);

    updateDoc(doc(db, "startedGames", gameId), {
      mergeInProgress: true,
      mergePlayersOrder: owners,
      mergeChoiceIndex: 0,
      currentSmallerHQ: smallerHQ.name,
      players: updatedPlayers,
    });
  };

  const [sellSwapAmount, setSellSwapAmount] = useState(0);

  const renderMergeDecision = () => {
    const order = mergePlayersOrder;

    if (mergeChoiceIndex >= order.length || order.length === 0) {
      console.log("All players have made their choice 222");
      endMergeProcess();
      return null;
    }

    const playerIndex = order[mergeChoiceIndex];
    const player = players[playerIndex];

    const smallerStocks =
      player.headquarters.find((h) => h.name === currentSmallerHQ.name)
        ?.stocks || 0;
    console.log("Player:", player.name, "Stocks:", smallerStocks);
    if (smallerStocks === 0) {
      goToNextMergePlayer();
      return;
    }

    const handleSell = () => {
      if (sellSwapAmount <= 0) return;
      if (sellSwapAmount > smallerStocks) return;

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
      if (sellSwapAmount <= 0) return;
      if (sellSwapAmount > smallerStocks) return;


      const swapCount = Math.floor(sellSwapAmount / 2);
      if (swapCount <= 0) return;

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

      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex(
        (hq) => hq.name === currentSmallerHQ.name
      );
      const bigIndex = newHQS.findIndex((hq) => hq.name === bigHQ.name);

      newHQS[smallIndex].stocks += swapCount * 2;

      newHQS[bigIndex].stocks -= swapCount;

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

    return (
      <div>
        <h3>
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

        <button onClick={handleSell}>Sell</button>
        <button onClick={handleSwap}>Swap</button>
      </div>
    );
  };

  const mergeAIDecision = () => {
    const player = players[currentPlayerIndex];
    const smallerStocks =
      player.headquarters.find((h) => h.name === currentSmallerHQ.name)?.stocks || 0;
  
    console.log("Player:", player.name, "Stocks in smaller HQ:", smallerStocks);
  
    if (smallerStocks === 0) {
      goToNextMergePlayer();
      return;
    }
  
    // Randomly decide between "sell" and "swap"
    const decision = smallerStocks >= 2 ? (Math.random() < 0.5 ? "swap" : "sell") : "sell";
  
    if (decision === "swap") {
      // Swap logic: 2 stocks from the smaller HQ for 1 stock in the bigger HQ
      const swapCount = Math.floor(smallerStocks / 2); // Calculate how many swaps can be made
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
  
      console.log(
        `${player.name} chose to swap ${swapCount * 2} stocks for ${swapCount} stocks in the bigger HQ.`
      );
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
  
      console.log(
        `${player.name} chose to sell ${sellAmount} stocks for $${totalMoney}.`
      );
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

  const persistGameToFirestore = async (updatedPlayers, updatedHQS) => {
    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      await updateDoc(gameDocRef, {
        players: updatedPlayers,
        HQS: updatedHQS,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
  };

  const goToNextMergePlayer = async () => {
    const nextIndex = mergeChoiceIndex + 1;
    setMergeChoiceIndex(nextIndex);

    console.log("Next merge player:", nextIndex);

    try {
      if (nextIndex >= mergePlayersOrder.length) {
        console.log("All players have made their choice");
        endMergeProcess();
        return;
      }
      const gameDocRef = doc(db, "startedGames", gameId);
      await updateDoc(gameDocRef, {
        mergeChoiceIndex: nextIndex,
      });
    } catch (err) {
      console.error("Failed to update Firestore for next merge player:", err);
    }
  };

  const endMergeProcess = () => {
    const newHQS = [...HQS];
    const newBoard = [...board];

    console.log("Merging HQs:", currentSmallerHQ, bigHQ);

    if (bigHQ && currentSmallerHQ) {
      const biggerIndex = newHQS.findIndex((h) => h.name === bigHQ.name);
      const smallerIndex = newHQS.findIndex(
        (h) => h.name === currentSmallerHQ.name
      );

      console.log("Bigger:", biggerIndex, "Smaller:", smallerIndex);
      console.log("Selected tile to merge:", selectedTileToMerge);
      console.log("bigger tiles:", newHQS[biggerIndex].tiles);
      console.log("smaller tiles:", newHQS[smallerIndex].tiles);
      if (biggerIndex !== -1 && smallerIndex !== -1) {
        newHQS[biggerIndex].tiles = [
          ...new Set([
            ...newHQS[biggerIndex].tiles,
            ...newHQS[smallerIndex].tiles,
            ...getConnectedGrayTiles(board, selectedTileToMerge),
            selectedTileToMerge,
          ]),
        ];
        console.log("New bigger tiles:", newHQS[biggerIndex].tiles);

        newHQS[biggerIndex].price = updateHQPrice(
          bigHQ,
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

    console.log("Merge process complete");
    console.log("New HQS:", newHQS);
    console.log("New Board:", newBoard);

    setMergeInProgress(false);
    setMergePlayersOrder([]);
    setSelectedTileToMerge(null);
    persistPlayersToFirestore(newHQS, newBoard);
  };

  const persistPlayersToFirestore = async (newHQS, newBoard) => {
    console.log("Persisting players to Firestore:", players);
    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      await updateDoc(gameDocRef, {
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
          const snap = await getDoc(playerDocRef);
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
      players[currentPlayerIndex].email.startsWith("bot")
    ) {
      console.log("Bot turn detected. Adding delay before making a move.");

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

    if (!timerRef.current) {
      setTimeLeft(30); 
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
          const smallerHQ = HQS.find((h) => h.name === data.currentSmallerHQ);
          console.log("smallerHQ", smallerHQ);
          setCurrentSmallerHQ(smallerHQ);
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

  const checkForWinner = async (updatedPlayers, updatedHQS) => {
    console.log("Checking for winner...");

    const unusedTiles = getAllUnusedTiles();
    const noTilesLeft = unusedTiles.length === 0;

    const allHqsOver10 = updatedHQS.every((hq) => hq.tiles.length > 10);

    if (noTilesLeft || allHqsOver10) {
      let richest = updatedPlayers[0];
      for (let i = 1; i < updatedPlayers.length; i++) {
        if (updatedPlayers[i].money > richest.money) {
          richest = updatedPlayers[i];
        }
      }

      const theWinner = richest.name;

      setWinner(theWinner);

      try {
        const gameDocRef = doc(db, "startedGames", gameId);
        await updateDoc(gameDocRef, {
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
        console.log("Finishing turn after random move");
        handleOptionClickRandom("finish turn", tileToPlace);
      }, 0);
    } else {
      console.log("No tiles to place. Finishing turn.");
      handleOptionClickRandom("finish turn");
    }
  };

  const handleOptionClickRandom = (option, tileIndex) => {
    if (tileIndex == null) return;
    const newBoard = [...board];

    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    currPlayer.tiles = currPlayer.tiles.filter((t) => t !== tileIndex);
    updatedPlayers[currentPlayerIndex] = currPlayer;

    const connectedTiles = [...getConnectedGrayTiles(newBoard, tileIndex), tileIndex];
    const neighborColors = checkNeighborColor(tileIndex);

    if (neighborColors.length === 0) {
      console.log(newBoard[tileIndex].label + ' gray ' + currPlayer.name);
      newBoard[tileIndex] = {
        ...newBoard[tileIndex],
        color: "gray",
      };

      if (checkStartHQ(tileIndex) && currPlayer.email.startsWith("bot")) {
        const hqsWithNoTiles = HQS.filter((hq) => hq.tiles.length === 0);
        console.log("hqsWithNoTiles", hqsWithNoTiles);
        const randomHQIndex = Math.floor(Math.random() * hqsWithNoTiles.length);
        const selectedHQ = hqsWithNoTiles[randomHQIndex];
        console.log("Selected HQ:", selectedHQ.name);

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
      console.log(newBoard[tileIndex].label + ' colored ' + currPlayer.name);
      const hqColors = HQS.map((hq) => hq.color);
      const selectedColor =
        hqColors.find((color) => neighborColors.includes(color)) || "gray";
      if (selectedColor !== "gray") {
        console.log('working');
        console.log(connectedTiles);
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
      // maybe thier is bug here
      handleMerge(neighborColors, tileIndex);
    }
      if (turnCounter >= 1) {
        const newTiles = assignNewRandomTiles(1, newBoard);
        updatedPlayers[currentPlayerIndex].tiles.push(...newTiles);
      }
  
      let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      const newTurnCounter =
        nextPlayerIndex === 0 ? turnCounter + 1 : turnCounter;
  
      if (newTurnCounter === 1) {
        for (let i = 0; i < players.length; i++) {
          if (updatedPlayers[i].tiles.length === 0) {
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

    try {
      console.log("updateDoc");
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
    checkForWinner(updatedPlayers, HQS);
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

  const getAllUnusedTiles = () => {
    const playerTiles = new Set(players.flatMap((player) => player.tiles));

    const unusedTiles = board.filter((tile) => {
      const tileIndex = board.indexOf(tile);
      return tile.color === "white" && !playerTiles.has(tileIndex);
    });

    return unusedTiles;
  };

  const assignNewRandomTiles = (tilesToAssign) => {
    const unusedTiles = getAllUnusedTiles();

    if (unusedTiles.length === 0) {
      console.log("No unused tiles available to assign.");
      return [];
    }

    const newTiles = [];
    for (let i = 0; i < tilesToAssign; i++) {
      if (unusedTiles.length === 0) {
        console.log("Ran out of unused tiles.");
        break;
      }

      const randomIndex = Math.floor(Math.random() * unusedTiles.length);
      const selectedTile = unusedTiles[randomIndex];

      selectedTile.used = true;

      const tileIndex = board.indexOf(selectedTile);
      newTiles.push(tileIndex);

      unusedTiles.splice(randomIndex, 1);
    }

    console.log("Assigned tiles:", newTiles);
    return newTiles;
  };

  const handleOptionClick = async (option) => {
    if (selectedTile == null) return;

    const newBoard = [...board];

    console.log("Option: 2", currentPlayerIndex);

    if (newBoard[selectedTile].color === "white") {
      newBoard[selectedTile] = {
        ...newBoard[selectedTile],
        color: "gray",
        used: true,
      };
    }
    console.log("Option: 3", currentPlayerIndex);

    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    currPlayer.tiles = currPlayer.tiles.filter((t) => t !== selectedTile);
    updatedPlayers[currentPlayerIndex] = currPlayer;

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
      console.log(neighborColors);
      let checkMerge = handleMerge(neighborColors, selectedTile);
      alert("Handel merge");
      if (checkMerge === true) {
        return;
      }
    }
    console.log("Option: 4", currentPlayerIndex);

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
      let richest = updatedPlayers[0];
      for (let i = 1; i < updatedPlayers.length; i++) {
        if (updatedPlayers[i].money > richest.money) {
          richest = updatedPlayers[i];
        }
      }

      const theWinner = richest.name;

      setWinner(theWinner);
      try {
        const gameDocRef = doc(db, "startedGames", gameId);
        await updateDoc(gameDocRef, {
          winner: theWinner,
        });
      } catch (err) {
        console.error("Error updating Firestore:", err);
      }
      return;
    }

    console.log("Option: 5", currentPlayerIndex);
    if (isMerging) return;


    if (turnCounter >= 1) {
      const newTiles = assignNewRandomTiles(1, newBoard);
      updatedPlayers[currentPlayerIndex].tiles.push(...newTiles);
    }

    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const newTurnCounter =
      nextPlayerIndex === 0 ? turnCounter + 1 : turnCounter;

    if (newTurnCounter === 1) {
      for (let i = 0; i < players.length; i++) {
        if (updatedPlayers[i].tiles.length === 0) {
          const newTiles = assignNewRandomTiles(6, newBoard);
          updatedPlayers[i].tiles.push(...newTiles);
        }
      }
    }
    console.log("Option: 6", currentPlayerIndex);

    setBoard(newBoard);
    setPlayers(updatedPlayers);
    setCurrentPlayerIndex(nextPlayerIndex);
    setTurnCounter(newTurnCounter);
    setShowOptions(false);
    setSelectedTile(null);
    setStocksBoughtThisTurn(0);

    console.log("Option: 7", currentPlayerIndex);

    try {
      const gameDocRef = doc(db, "startedGames", gameId);
      await updateDoc(gameDocRef, {
        board: newBoard,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnCounter: newTurnCounter,
        HQS: HQS,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
    checkForWinner(updatedPlayers, HQS);
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

  const handleHQSelection = async (hqName) => {
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
      await updateDoc(gameDocRef, {
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
    return `Current player turn: ${
      players[currentPlayerIndex]?.name || "Loading..."
    } `;
  };

  const handleReturnHome = () => {
    navigate("/menu");
  };

  const handleBuyStock = async () => {
    console.log("buy current player index", currentPlayerIndex);
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

    console.log("Current player Index:", currentPlayerIndex);
    console.log("Current player:", currPlayer);
    console.log("Current player money:", currPlayer.money);

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
      await updateDoc(gameDocRef, {
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

  const handleSellStock = async () => {
    setSellError("");

    if (!selectedHQToSell || sellAmount <= 0) {
      setSellError("Select an HQ and enter a valid amount to sell.");
      return;
    }

    const newHQS = [...HQS];
    const hqIndex = newHQS.findIndex((h) => h.name === selectedHQToSell);

    const updatedPlayers = [...players];
    const currPlayer = { ...updatedPlayers[currentPlayerIndex] };

    console.log("Current player Index:", currentPlayerIndex);
    console.log("Current player:", currPlayer);
    console.log("Current player money:", currPlayer.money);
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
      await updateDoc(gameDocRef, {
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

  return (
    <div className="game">
      <FriendList />
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

      <div className="game-info">
        <div>
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
          </div>
        )}

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
              <div className="player-name">
                {player.email.startsWith("bot")
                  ? player.name + " (Bot)"
                  : player.name}
              </div>
              <div className="player-money">Money: ${player.money}</div>

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

        <div className="hqs-info">
          <h3>Headquarters Stocks</h3>
          {HQS.map((hq, index) => (
            <div key={index} className="hq-stock">
              <span style={{ color: hq.color }}>■</span> {hq.name}:{hq.stocks}{" "}
              stocks, ${hq.price} each, {hq.tiles.length} tiles
            </div>
          ))}
        </div>

        <button className="return-home-button" onClick={handleReturnHome}>
          Return to Menu
        </button>
      </div>

      {showOptions && (
        <div className="options">
          {HQS.some((hq) => hq.tiles.length > 0) && (
            <>
              <button onClick={() => handleOptionClick("buy")}>
                Buy Stock
              </button>
              <button onClick={() => handleOptionClick("sell")}>
                Sell Stock
              </button>
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
            value={selectedHQToBuy}
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
            value={selectedHQToSell}
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
          console.log("currentMergePlayer:", currentMergePlayer);
          console.log("email:", userEmail);
          if (currentMergePlayer.email === userEmail) {
            return (
              <div className="hq-modal-overlay">
                <div className="hq-modal">{renderMergeDecision()}</div>
              </div>
            );
          } else if (currentMergePlayer.email.startsWith("bot")) {
            return (
              <div className="waiting-overlay">
                <div className="waiting-message">
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