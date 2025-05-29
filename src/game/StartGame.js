import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../Firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import "./StartGame.css";
import FriendList from "../friendsManagement/FriendList";
import { checkNeighborColor, createInitialBoard, assignNewRandomTiles, getConnectedGrayTiles } from "./HelperFunctions";
import { checkCanEnd, checkForWinner } from "./GameLogic";
import { ManageHQS } from "./HQS";
import { ManageMergeLogic } from "./MergeLogic";
import SellModal from "./Models/SellModal";
import BuyModal from "./Models/BuyModal";
import StartHQModal from "./Models/StartHQModal";
import PlayersInfoPanel from "./PlayersInfoPanel";
import { InitializeGame } from "./InitializeGame";
import WinnerOverlay from "./WinnerOverlay";
import { AIMoveLogic } from "./AI/AIMoveLogic";


const StartGame = () => {
    const [HQS, setHQS] = useState([
    { name: "Sackson", stocks: 25, tiles: [], price: 0, color: "red" },
    { name: "Tower", stocks: 25, tiles: [], price: 0, color: "yellow" },
    { name: "American", stocks: 25, tiles: [], price: 0, color: "darkblue" },
    { name: "Festival", stocks: 25, tiles: [], price: 0, color: "green" },
    { name: "WorldWide", stocks: 25, tiles: [], price: 0, color: "purple" },
    { name: "Continental", stocks: 25, tiles: [], price: 0, color: "blue" },
    { name: "Imperial", stocks: 25, tiles: [], price: 0, color: "orange" },
  ]);
  const { checkStartHQ, updateHQ, getBonus } = ManageHQS();

  const [players, setPlayers] = useState([]);

  const { getTop2PlayersWithMostStocks } = ManageMergeLogic();


  //======merge logic======
  const [isMerging, setIsMerging] = useState(false);
  
    const [hqsWithEqualTileCount, setHqsWithEqualTileCount] = useState(null);
    const [showTieModal, setShowTieModal] = useState(false);
  
    const [mergeInProgress, setMergeInProgress] = useState(false);
    const [mergePlayersOrder, setMergePlayersOrder] = useState([]);
    const [mergeChoiceIndex, setMergeChoiceIndex] = useState(0);
  
    const [currentSmallerHQ, setCurrentSmallerHQ] = useState(null);
    const [currentBigHQ, setCurrentBigHQ] = useState(null);
    const [currentSelectedTileToMerge, setCurrentSelectedTileToMerge] = useState(null);
  
  
    const handleMerge = (neighborColors, selectedTileToMerge) => {
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
        setHqsWithEqualTileCount(firstTwoHQS);
        setShowTieModal(true);
        return;
      }
  
      // Not a tie, proceed directly
      let [smaller, bigger] = firstTwoHQS;
      doMergeLogic(smaller, bigger, selectedTileToMerge);
      return true;
    };

    const doMergeLogic = (smallerHQ, biggerHQ, tile) => {
        console.log("Smaller HQ:", smallerHQ);
        console.log("Bigger HQ:", biggerHQ);
        console.log("Tile to merge:", tile);
    
        setCurrentSmallerHQ(smallerHQ);
        setCurrentBigHQ(biggerHQ);
        setCurrentSelectedTileToMerge(tile);
            const newHQS = [...HQS];
    const bigIndex = newHQS.findIndex(hq => hq.name === biggerHQ.name);
    if (bigIndex !== -1) {
        // Add the tile if not already present
        if (!newHQS[bigIndex].tiles.includes(tile)) {
newHQS[bigIndex].tiles = [
  ...new Set([
    ...newHQS[bigIndex].tiles,
    ...getConnectedGrayTiles(board, tile),
    tile
  ])
];        }
        setHQS(updateHQ(newHQS));
    }



      console.log("Starting merge logic with smallerHQ:", currentSmallerHQ, "and biggerHQ:", currentBigHQ);

    
        // Stock bonus logic
        const top2Players = getTop2PlayersWithMostStocks(players, smallerHQ.name);
        const firstPlayerBonus = getBonus(smallerHQ.name, HQS)[0];
        const secondPlayerBonus = getBonus(smallerHQ.name, HQS)[1];
        console.log("Top 2 players:", top2Players);
        console.log("Bonuses:", firstPlayerBonus, secondPlayerBonus);
    
    
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
          endMergeProcess(smallerHQ, biggerHQ);
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
          HQS: updateHQ(newHQS),
          currentSelectedTileToMerge: tile,
          currentSmallerHQ: smallerHQ.name,
          currentBigHQ: biggerHQ.name,
          players: updatedPlayers,
        });
      };
    
  const [sellSwapAmount, setSellSwapAmount] = useState(0);
  const [mergeError, setMergeError] = useState("");

  const renderMergeDecision = () => {
    
    const order = mergePlayersOrder;

    if (mergeChoiceIndex >= order.length || order.length === 0) {
      console.log("No more players to make a merge decision");
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

      setHQS(updateHQ(newHQS));

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
          } else if (hq.name === currentBigHQ?.name) {
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
      const bigIndex = newHQS.findIndex((hq) => hq?.name === currentBigHQ?.name);
    
      if (smallIndex !== -1) {
        newHQS[smallIndex].stocks += swapCount * 2;
      }
      if (bigIndex !== -1) {
        newHQS[bigIndex].stocks -= swapCount;
      }
    
      setHQS(updateHQ(newHQS));
    
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

const mergeAIDecision = () => {
  setTimeout(() => {
    const player = players[currentPlayerIndex];
    const smallerStocks =
      player.headquarters.find((h) => h.name === currentSmallerHQ.name)?.stocks || 0;

    console.log("AI decision for merging:", player.name, "with stocks:", smallerStocks);

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
          } else if (hq.name === currentBigHQ.name) {
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
      const bigIndex = newHQS.findIndex((hq) => hq.name === currentBigHQ.name);

      newHQS[smallIndex].stocks += swapCount * 2;
      newHQS[bigIndex].stocks -= swapCount;

      setHQS(updateHQ(newHQS));

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

      setHQS(updateHQ(newHQS));
    }

    const stillHasStocks =
      players[currentPlayerIndex].headquarters.find((h) => h.name === currentSmallerHQ.name)?.stocks || 0;

    if (stillHasStocks === 0) {
      goToNextMergePlayer();
    } else {
      setSellSwapAmount(0);
    }

    persistGameToFirestore(players, HQS);
  }, 3500); // 2 second delay
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
    console.log("Going to next merge player:", nextIndex);
    console.log("Merge players order:", mergePlayersOrder);

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

  const endMergeProcess = (smallerHQ,biggerHQ) => {
    console.log("Ending merge process");
    const newHQS = [...HQS];
    const newBoard = [...board];

    console.log("Big HQ:", currentBigHQ);
    console.log("Current smaller HQ:", currentSmallerHQ);

    console.log("Bigger HQ:", biggerHQ);
    console.log("cCurrent smaller HQ:", smallerHQ);

    console.log("Current selected tile to merge:", currentSelectedTileToMerge);

    if (((biggerHQ && smallerHQ) || (currentBigHQ && currentSmallerHQ))) {

      const smallerHQend = smallerHQ || currentSmallerHQ;
      const biggerHQend = biggerHQ || currentBigHQ;

    const smallHQIndex = newHQS.findIndex((hq) => hq.name === (smallerHQend.name || smallerHQend));
    if (smallHQIndex !== -1) {
      const sellPrice = newHQS[smallHQIndex].price;
      const updatedPlayers = [...players];
      updatedPlayers.forEach((player, idx) => {
        const playerHQIndex = player.headquarters.findIndex((hq) => hq.name === (smallerHQend.name || smallerHQend));
        if (playerHQIndex !== -1 && player.headquarters[playerHQIndex].stocks > 0) {
          console.log(`Selling stocks for player ${player.name}`);
          const stocksToSell = player.headquarters[playerHQIndex].stocks;
          // Add money for sold stocks
          updatedPlayers[idx].money += stocksToSell * sellPrice;
          // Add stocks back to HQ
          newHQS[smallHQIndex].stocks += stocksToSell;
          // Remove stocks from player
          updatedPlayers[idx].headquarters[playerHQIndex].stocks = 0;
        }
      });
      setPlayers(updatedPlayers);
    }

      console.log("Merging HQs:", smallerHQend, biggerHQend);
      const biggerIndex = newHQS.findIndex((h) => h.name === biggerHQend.name);
      const smallerIndex = newHQS.findIndex(
        (h) => h.name === smallerHQend.name
      );
      console.log("Bigger HQ index:", biggerIndex);
      console.log("Smaller HQ index:", smallerIndex);
      console.log("Selected tile to merge:", currentSelectedTileToMerge);
      if (biggerIndex !== -1 && smallerIndex !== -1) {
        console.log("Merging tiles");
        newHQS[biggerIndex].tiles = [
          ...new Set([
            ...newHQS[biggerIndex].tiles,
            ...newHQS[smallerIndex].tiles,
          ]),
        ];

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
    setHQS(updateHQ(newHQS));

    setBoard(newBoard);

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
      const gameDocRef = doc(db, "startedGames", gameId);
      updateDoc(gameDocRef, {
        mergeInProgress: false,
        mergePlayersOrder: [],
        mergeChoiceIndex: mergeChoiceIndex + 1,
        currentSmallerHQ: null,
        currentBigHQ: null,
        currentSelectedTileToMerge: null,
        players: players,
        HQS: newHQS,
        board: newBoard,
      });
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
  };

  const handleBiggerHQSelection = (bigger, smaller, tile) => {
    setShowTieModal(false);
    setHqsWithEqualTileCount(null);
    doMergeLogic(smaller, bigger, tile);
  };

  const handleTieModalCancel = () => {
    setShowTieModal(false);
    setHqsWithEqualTileCount(null);
    setIsMerging(false);
  };

  //======merge logic end======

  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const [turnCounter, setTurnCounter] = useState(0);
  const [showAllPlayers, setShowAllPlayers] = useState(false);


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

  const aiMoveLogic = new AIMoveLogic({
  players,
  setPlayers,
  HQS,
  setHQS,
  board,
  setBoard,
  updateHQ,
  checkStartHQ,
  handleMerge,
  gameId,
  db,
  stocksBoughtThisTurn,
  setStocksBoughtThisTurn,
  turnCounter,
  setCurrentPlayerIndex,
  setTurnCounter,
  setShowOptions,
  currentPlayerIndex,
});

  useEffect(() => {
    if (
      players[currentPlayerIndex] &&
      players[currentPlayerIndex].email.startsWith("bot") &&
      !mergeInProgress &&
      winner === null &&
      userEmail === gameHost
    ) {

      const botMoveTimeout = setTimeout(() => {
        aiMoveLogic.handleRandomMove();
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
            aiMoveLogic.handleRandomMove();
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
          await InitializeGame({
  roomData,
  HQS,
  userEmail,
  gameId,
  db
});
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
          setHQS(updateHQ(data.HQS || HQS));
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
            setCurrentSmallerHQ(smallerHQ || null);
            setCurrentBigHQ(HQS.find((h) => h.name === data.currentBigHQ) || null);
            setCurrentSelectedTileToMerge(data.selectedTileToMerge || null);
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
    let checkMerge = false;
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
        setHQS(updateHQ(newHQS));
      }
    } else if (neighborColors.length > 1) {
      setBoard(newBoard);
      console.log("getPlayers", players);
      console.log("selectedTile", selectedTile);
      checkMerge = handleMerge(neighborColors, selectedTile);
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
      checkForWinner(updatedPlayers, HQS ,board , true, gameId);
      return;
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

    setPlayers(updatedPlayers);
    setCurrentPlayerIndex(nextPlayerIndex);
    setTurnCounter(newTurnCounter);
    setShowOptions(false);
    setStocksBoughtThisTurn(0);

    checkForWinner(updatedPlayers, HQS ,board ,false, gameId);

    try {
      if (!checkMerge) {
      const gameDocRef = doc(db, "startedGames", gameId);
      updateFirestoreWithRetry(gameDocRef, {
        board: newBoard,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnCounter: newTurnCounter,
        HQS: HQS,
      });
      }
    } catch (err) {
      console.error("Error updating Firestore:", err);
    }
  };

  const updateFirestoreWithRetry = (docRef, data, maxRetries = 10) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        updateDoc(docRef, data);
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
      setHQS(updateHQ(newHQS));
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
    return `Current player turn: ${players[currentPlayerIndex]?.name || "Loading..."} `;
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
    setHQS(updateHQ(newHQS));
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
    setHQS(updateHQ(newHQS));
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
  <WinnerOverlay
    winner={winner}
    players={players}
    handleReturnHome={handleReturnHome}
  />
)}
        <button onClick={toggleShowAllPlayers}>
          {showAllPlayers ? "Show Only Me" : "Show All Players"}
        </button>
<PlayersInfoPanel
  winner={winner}
  players={players}
  userEmail={userEmail}
  HQS={HQS}
  renderTileButton={renderTileButton}
  showAllPlayers={showAllPlayers}
/>

        <button className="return-home-button" onClick={handleReturnHome}>
          Return to Menu
        </button>
      </div>

     {showOptions && !mergeInProgress && winner === null && !startHQ && !showBuyModal && !showSellModal && !showTieModal && (
  <div className="options">
    {/* X button to close the modal */}
    <button
      className="close-modal-btn"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        fontSize: "1.2em",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "red",
      }}
      onClick={() => setShowOptions(false)}
      aria-label="Close"
    >
      ×
    </button>
    <h3>
      Current Selected Tile:{" "}
      {selectedTile !== null && selectedTile !== undefined
        ? board[selectedTile].label || "Unknown"
        : "No tile selected"}
    </h3>
    {HQS.some((hq) => hq.tiles.length > 0) && (
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
    {checkStartHQ(selectedTile, board, HQS) && (
      <>
        <button onClick={() => handleOptionClick("start hq")}>
          Start HQ
        </button>
      </>
    )}
    {checkCanEnd(selectedTile, HQS, board) && (
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
  <StartHQModal
    HQS={HQS}
    handleHQSelection={handleHQSelection}
    setStartHQ={setStartHQ}
  />
)}

{showBuyModal && (
  <BuyModal
    HQS={HQS}
    selectedHQToBuy={selectedHQToBuy}
    setSelectedHQToBuy={setSelectedHQToBuy}
    buyAmount={buyAmount}
    setBuyAmount={setBuyAmount}
    buyError={buyError}
    handleBuyStock={handleBuyStock}
    setShowBuyModal={setShowBuyModal}
  />
)}

{showSellModal && (
  <SellModal
    HQS={HQS}
    players={players}
    currentPlayerIndex={currentPlayerIndex}
    selectedHQToSell={selectedHQToSell}
    setSelectedHQToSell={setSelectedHQToSell}
    sellAmount={sellAmount}
    setSellAmount={setSellAmount}
    sellError={sellError}
    handleSellStock={handleSellStock}
    setShowSellModal={setShowSellModal}
  />
)}

      {showTieModal && hqsWithEqualTileCount && (
        <>
          <div className="hq-modal-overlay" onClick={handleTieModalCancel} />

          <div className="hq-modal">
            <h3>Both HQs have the same number of tiles!</h3>
            <p>Which one should be considered the Bigger HQ?</p>

            <button
              onClick={() => handleBiggerHQSelection(hqsWithEqualTileCount[0], hqsWithEqualTileCount[1], selectedTile)}
            >
              {hqsWithEqualTileCount[0].name}
            </button>
            <button
              onClick={() => handleBiggerHQSelection(hqsWithEqualTileCount[1], hqsWithEqualTileCount[0], selectedTile)}
            >
              {hqsWithEqualTileCount[1].name}
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
            endMergeProcess(currentSmallerHQ,currentBigHQ);
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
                  Merging HQ: {currentSmallerHQ.name}
                  {currentBigHQ && ` and ${currentBigHQ.name}`}
                  <br />
                  <br />
                  Waiting for {currentMergePlayer.name} to decide...
                </div>
                  <>{mergeAIDecision()}</>
              </div>
            );
          }
          else {
            return (
              <div className="waiting-overlay">
                <div className="waiting-message">
                  Merging HQ: {currentSmallerHQ.name}
                  {currentBigHQ && ` and ${currentBigHQ.name}`}
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