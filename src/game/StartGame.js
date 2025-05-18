import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../Firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import "./StartGame.css";
import images from "../menu/dashboard/imageUtils";
import FriendList from "../friendsManagement/FriendList";
import { checkNeighborColor, createInitialBoard, sortPlayersbyTile, getAllUnusedTiles, assignNewRandomTiles, InitializePlayersFundsAndTiles, getConnectedGrayTiles } from "./HelperFunctions";
import { checkCanEnd } from "./GameLogic";
import { ManageHQS } from "./HQS";

const StartGame = () => {
  const { HQS, checkStartHQ, updateHQ, getBonus } = ManageHQS();

  const getTop2PlayersWithMostStocks = (hqName) => {
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
    doMergeLogic(smaller, bigger);
    return true;
  };

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

      updateHQ(newHQS);
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
    updateHQ(newHQS);
    
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
          Merging HQ: {currentSmallerHQ.name}
          {bigHQ && ` and ${bigHQ.name}`}
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

      setPlayers(updatedPlayers);

      const newHQS = [...HQS];
      const smallIndex = newHQS.findIndex((hq) => hq.name === currentSmallerHQ.name);
      newHQS[smallIndex].stocks += sellAmount;

      updateHQ(newHQS);
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

    setBoard(newBoard);

    setMergeInProgress(false);
    setMergePlayersOrder([]);
    setSelectedTileToMerge(null);
    setCurrentSmallerHQ(null);
    setMergeChoiceIndex(0);
    setShowTieModal(false);
    setBigHQ(null);
    setTieHQs(null);
    setIsMerging(false);
    setSellSwapAmount(0);
    setMergeError("");
    persistPlayersToFirestore(newHQS, newBoard);
  };

  const persistPlayersToFirestore = (newHQS, newBoard) => {
    try {
      console.log("Persisting players to Firestore");
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
  const [gameHost, setGameHost] = useState(null);

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
  
      const newBoard = createInitialBoard();
  
      

      const playersWithTiles = InitializePlayersFundsAndTiles(validPlayers, newBoard);
  
      const sortPlayers = sortPlayersbyTile(playersWithTiles);
  
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
        host: userEmail,
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
      winner === null &&
      userEmail === gameHost
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

    if (!timerRef.current && !mergeInProgress && winner === null && userEmail === gameHost) {
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
          setGameHost(userEmail);
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
          setGameHost(data.host || userEmail);

          if (newIndex !== currentPlayerIndex.current) {
            setTilesAssignedThisTurn(false);
          }

          setCurrentPlayerIndex(newIndex);
          setWinner(data.winner || null);
          updateHQ(data.HQS || HQS);
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
    const neighborColors = checkNeighborColor(tileIndex, board);

    if (neighborColors.length === 0) {
      newBoard[tileIndex] = {
        ...newBoard[tileIndex],
        color: "gray",
      };

      if (checkStartHQ(tileIndex, board) && currPlayer.email.startsWith("bot")) {
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
        newHQS[hqIndex].stocks -= 1;
        const playerHqIndex = currPlayer.headquarters.findIndex(
          (h) => h.name === selectedHQ.name
        );

        currPlayer.headquarters[playerHqIndex].stocks += 1;
        updatedPlayers[currentPlayerIndex] = currPlayer;
        setPlayers(updatedPlayers);
        updateHQ(newHQS);
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
        const newHQS = [...HQS];
        const hqIndex = newHQS.findIndex((hq) => hq.color === selectedColor);
        newHQS[hqIndex].tiles = [
          ...new Set([...newHQS[hqIndex].tiles, ...connectedTiles]),
        ];
        updateHQ(newHQS);
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
        updateHQ(newHQS);
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
    
        updateHQ(newHQS);
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
    // checkForWinner(updatedPlayers, HQS, false);
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
    const neighborColors = checkNeighborColor(selectedTile, board);

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
        const newHQS = [...HQS];
        const hqIndex = newHQS.findIndex((hq) => hq.color === selectedColor);
        newHQS[hqIndex].tiles = [
          ...new Set([...newHQS[hqIndex].tiles, ...connectedTiles]),
        ];
        updateHQ(newHQS);
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
      updateHQ(newHQS);
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
    updateHQ(newHQS);
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
    updateHQ(newHQS);
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
          {checkStartHQ(selectedTile, board) && (
            <>
              <button onClick={() => handleOptionClick("start hq")}>
                Start HQ
              </button>
            </>
          )}
          {checkCanEnd(selectedTile,HQS,board) && (
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
              <>{mergeAIDecision()}</>
            );
          }
          else {
            return (
              <div className="waiting-overlay">
                <div className="waiting-message">
                  Merging HQ: {currentSmallerHQ.name}
                  {bigHQ && ` and ${bigHQ.name}`}
                  <br />
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